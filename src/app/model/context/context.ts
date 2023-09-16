import { Instruction } from '../instructions/instruction';
import { asapScheduler, combineLatest, interval, Observable, of, ReplaySubject, Subject, throwError, zip } from 'rxjs';
import { RUN } from '../instructions/run';
import { IF } from '../instructions/if';
import { Method } from '../instructions/method';
import { IF_ELSE } from '../instructions/ifelse';
import { WHILE } from '../instructions/while';
import { catchError, concatMap, delay, filter, map, shareReplay, take, takeWhile, tap } from 'rxjs/operators';
import { FORI } from '../instructions/fori';
import { ConditionalInstruction } from '../instructions/conditional';
import { LET } from '../instructions/let';
import { ReadWriteProvider } from '../readwriteprovider';
import { RETURN } from '../instructions/return';
import { CALL } from '../instructions/call';
import { ProgramContext } from './program-context';
import { StaticInject } from '../../../util/lifecycle/static-injector';
import { BreakpointService } from '../../breakpoint.service';

export class Context implements ReadWriteProvider {
  @StaticInject(BreakpointService)
  protected breakpointService: BreakpointService;

  protected readonly ___selfResume$ = new Subject<void>();
  protected readonly resume$ = this.___selfResume$.asObservable();
  protected readonly toExecute$ = new ReplaySubject<Instruction>(1);
  protected readonly exit$ = new ReplaySubject<ExitCode>(1);
  protected readonly declarations = new Map<string, unknown>();
  private readonly declarationsChanged$ = new ReplaySubject<void>(1);

  private virtualBreakpoint: boolean = false;

  protected parent: Context = null;
  protected children: Context[] = [];

  public constructor(protected readonly instr: Instruction) {
    this.toExecute$.pipe(take(1)).subscribe((toExecute) => {
      const breakpointed =
        (toExecute.isBreakpointEnabled() || this.virtualBreakpoint) && !this.breakpointService.areBreakpointsHidden();

      toExecute.setActive(true);
      const start$ = breakpointed ? this.resume$.pipe(take(1)) : of<void>(null).pipe(shareReplay(1));

      start$
        .pipe(
          tap(() => {
            this.virtualBreakpoint = false;
            // wait for instruction and its children to complete
            this.executeChildren$(toExecute).subscribe((exitCodes) => {
              console.log(exitCodes);
              if (exitCodes.some((c) => c.code === 'RETURN')) {
                const retVals = exitCodes.filter((ec) => ec.code === 'RETURN');
                const retVal = retVals[0].returnVal;
                this.exit$.next({
                  code: 'RETURN',
                  instr: toExecute,
                  returnVal: retVal,
                });
                this.exit$.complete();
              } else {
                this.exit$.next({
                  code: 'SUCCESS',
                  instr: toExecute,
                });
              }

              toExecute.setActive(false);
              this.exit$.complete();
            });
          })
        )
        .subscribe();
    });
    this.toExecute$.pipe(delay(0, asapScheduler)).subscribe(() => {
      this.onRefresh();
    });
  }

  public execute(): void {
    this.toExecute$.next(this.instr);
  }

  public skip(): void {
    this.exit$.next({
      code: 'SKIPPED',
      instr: this.instr,
    });
    this.exit$.complete();
  }

  public return(ec: ExitCode): void {
    this.instr.setActive(false);
    if (this.instr instanceof Method) {
      // this.parent.declarations.set('return', ec);
      this.exit$.next({
        code: 'SUCCESS',
        instr: this.instr,
      });
    } else {
      this.exit$.next({
        code: 'RETURN',
        instr: this.instr,
      });
    }

    this.exit$.complete();
  }

  public onExit$(): Observable<ExitCode> {
    return this.exit$;
  }

  private executeChildren$(instr: Instruction): Observable<ExitCode[]> {
    if (instr instanceof Method) {
      return this.execMultipleAndZip$(this.setChildren(instr.getInstructions().map((i) => new Context(i))));
    } else if (instr instanceof RUN) {
      instr.getCode()?.(this);
      // No children, so instant completion
      return of([
        {
          code: 'SUCCESS',
          instr,
        },
      ]);
    } else if (instr instanceof LET) {
      // this.parent.declareVariable is because each instruction basically has its own private scope, which no one
      // else has access to after, so the parent scope/block... has to be used
      this.parent.declareVariable(instr.getDeclaredName(), instr.getValue(this));
      return of([
        {
          code: 'SUCCESS',
          instr,
        },
      ]);
    } else if (instr instanceof IF) {
      if (instr.evaluateCondition(this)) {
        return this.execMultipleAndZip$(this.setChildren(instr.getIfBody().map((i) => new Context(i))));
      } else {
        return of([
          {
            code: 'SUCCESS',
            instr,
          },
        ]);
      }
    } else if (instr instanceof IF_ELSE) {
      if (instr.evaluateCondition(this)) {
        return this.execMultipleAndZip$(this.setChildren(instr.getIfBody().map((i) => new Context(i))));
      } else {
        return this.execMultipleAndZip$(this.setChildren(instr.getElseBody().map((i) => new Context(i))));
      }
    } else if (instr instanceof WHILE) {
      return this.executeLoopAndZip$(
        instr,
        () => instr.evaluateCondition(this),
        (ctx) => {
          ctx.declarations.clear(); // so you can do let foo = "test"; inside the loop
        }
      );
    } else if (instr instanceof FORI) {
      let i: number = instr.getStartValue(this);
      let stepSize = instr.getStepSize(this);
      return this.executeLoopAndZip$(
        instr,
        () => instr.evaluateCondition(this, i),
        () => (i += stepSize)
      );
    } else if (instr instanceof RETURN) {
      const retVal = instr.getReturnValue(this);
      // this.setReturnValue(retVal);
      return of([
        {
          code: 'RETURN',
          instr,
          returnVal: retVal,
        },
      ]);
    } else if (instr instanceof CALL) {
      const root = this.getRoot() as ProgramContext;
      const method = root.instr
        .getChildren()
        .filter((e) => e instanceof Method)
        .map((e) => e as Method)
        .find((e) => e.getName() === instr.getMethodName());
      if (!method) {
        throw new Error('Method ' + instr.getMethodName() + ' not found!');
      }

      const methodContext = new Context(method);

      const args = instr.getArguments(this);
      args.forEach((v, k) => {
        methodContext.declareVariable(k, v);
      });

      return this.execMultipleAndZip$(this.setChildren([methodContext]));
    } else {
      throw new Error('NOT IMPLEMENTED!');
    }
  }

  /**
   * Emits when all contexts isntructions have finished
   * @param childCtxs
   * @private
   */
  private execMultipleAndZip$(childCtxs: Context[]): Observable<ExitCode[]> {
    const obs = childCtxs.map((c) => c.onExit$());
    const zipped = zip(...obs);

    for (let i = 0; i < childCtxs.length; i++) {
      const current = childCtxs[i];
      const predecessor = childCtxs[i - 1];

      // start if predecessor has run completely, or instantly, if it is the first instruction
      (
        predecessor?.onExit$() ??
        of(<ExitCode>{
          code: 'START',
          instr: null,
        })
      ).subscribe((ec) => {
        if (ec.returnVal) {
          const call = this.parent;
          if (call && call.instr instanceof CALL) {
            const callee = call.parent;
            const name = call.instr.getWriteReturnValueIntoName();
            console.log(name, ec.returnVal);
            if (name) {
              callee.writeVariable(name, ec.returnVal);
            }
          }
        }
        if (ec.code === 'SUCCESS' || ec.code === 'START') {
          current.execute();
        } else if (ec.code === 'SKIPPED') {
          current.skip();
        } else if (ec.code === 'RETURN') {
          this.return(ec);
        }
      });
    }

    return zipped;
  }

  private executeLoopAndZip$(
    instr: ConditionalInstruction,
    conditionProxy: () => boolean,
    afterEachIteration: (context: Context) => void = () => {}
  ): Observable<ExitCode[]> {
    // Create an observable that emits values at a fixed interval (e.g., every second)
    const source$ = interval(1);

    let loopNotBroken = true;

    // Create an observable for the loop
    const loop$ = new Observable<void>((observer) => {
      source$
        .pipe(
          takeWhile(() => conditionProxy() && loopNotBroken),
          concatMap(() => {
            if (!conditionProxy()) {
              // when going step by step, the takeWhile is somehow ignored sometimes?, so checking again here
              return of([] as ExitCode[]);
            }
            return this.execMultipleAndZip$(
              this.setChildren(
                instr
                  .getChildren()
                  .filter((e) => e instanceof Instruction)
                  .map((i: Instruction) => new Context(i))
              )
            );
          }),
          tap((exitCodes) => {
            afterEachIteration(this);
            if (exitCodes.some((code) => code.code === 'RETURN')) {
              loopNotBroken = false;
            }
          })
        )
        .subscribe({
          next: (exitCodes) => {
            // Continue the loop
            /*if (exitCodes.some((ec) => ec.code === 'RETURN')) {
              observer.complete();
            }*/
          },
          complete: () => {
            // The loop has completed
            observer.complete();
          },
          error: (error) => {
            // Handle errors if needed
            observer.error(error);
          },
        });
    });
    const loopFinished$ = new ReplaySubject<ExitCode[]>(1);
    loop$.subscribe({
      complete: () =>
        // TODO do return/break things
        loopFinished$.next([
          {
            code: 'SUCCESS',
            instr,
          },
        ]),
    });

    return loopFinished$;
  }

  /**
   * Sets the children this context and returns them.
   * @param children
   * @protected
   */
  public setChildren(children: Context[]): Context[] {
    // this.children.forEach((ch) => (this.parent = null));
    this.children = children;
    this.children.forEach((ch) => (ch.parent = this));
    return children;
  }

  public getChildren(): Context[] {
    return this.children;
  }

  public getParent(): Context {
    return this.parent;
  }

  protected findDeepestActive(): Context {
    if (!this.instr.isActive()) {
      return null;
    }
    let active: Context = this;
    while (active) {
      const next = active.children.find((c) => c.instr.isActive());
      if (!next) {
        break;
      }
      active = next;
    }
    return active;
  }

  protected findDeepestActivePath(): Context[] {
    if (!this.instr.isActive()) {
      return [];
    }
    const path: Context[] = [this];
    let active: Context = this;
    while (active) {
      const next = active.children.find((c) => c.instr.isActive());
      if (!next) {
        break;
      }
      active = next;
      path.push(next);
    }
    return path;
  }

  public setVirtualBreakpoint(value: boolean): void {
    this.virtualBreakpoint = true;
  }

  private setReturnValue<T>(value: T): void {
    this.parent.parent.declarations.set('return', value);
  }

  public declareVariable<T>(varName: string, initialValue: T): void {
    if (this.declarations.has(varName)) {
      throw new Error(`Variable '${varName}' is already declared in this scope`);
    }
    this.declarations.set(varName, initialValue);
    this.declarationsChanged$.next();
  }

  public writeVariable<T>(varName: string, value: T): void {
    if (!this.declarations.has(varName)) {
      if (this.parent) {
        this.parent.writeVariable(varName, value);
      } else {
        throw new Error(`Variable '${varName}' is not defined!`);
      }
    } else {
      this.declarations.set(varName, value);
      this.declarationsChanged$.next();
    }
  }

  public readVariable<T>(varName: string, unsafe = false): T {
    if (!this.declarations.has(varName)) {
      if (this.parent) {
        return this.parent.readVariable(varName);
      } else if (unsafe) {
        return undefined;
      } else {
        throw new Error(`Variable '${varName}' is not defined!`);
      }
    } else {
      const ret = this.declarations.get(varName) as T;
      return ret;
    }
  }

  public postIncr(varName: string): number {
    const val = this.readVariable<number>(varName);
    if (typeof val !== 'number') {
      throw new Error(varName + ' is not a number!');
    }
    this.writeVariable(varName, val + 1);
    return val;
  }

  public postDecr(varName: string): number {
    const val = this.readVariable<number>(varName);
    if (typeof val !== 'number') {
      throw new Error(varName + '  is not a number!');
    }
    this.writeVariable(varName, val - 1);
    return val;
  }

  public getDeclarations$(): Observable<{ key: string; value: unknown }[]> {
    return this.declarationsChanged$.pipe(
      map(() => {
        const arr = [...this.declarations.entries()];
        const a = arr.map(([k, v]) => ({ key: k, value: v }));
        return a;
      })
    );
  }

  public onRefresh(): void {
    this.parent?.onRefresh();
  }

  public getTitle(): string {
    return '#' + this.instr.getDescription();
  }

  public isNested(): boolean {
    return this.instr.isNestable();
  }

  public getRoot(): Context {
    let a: Context = this;
    while (a.parent) {
      a = a.parent;
    }

    return a;
  }
}

export interface ExitCode {
  instr: Instruction;
  code: 'SUCCESS' | 'RETURN' | 'ERROR' | 'SKIPPED' | 'START';
  returnVal?: any;
}
