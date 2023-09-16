import { Instruction } from '../instructions/instruction';
import { BehaviorSubject, from, interval, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { RUN } from '../instructions/run';
import { IF } from '../instructions/if';
import { ReadWriteProvider } from '../readwriteprovider';
import { WHILE } from '../instructions/while';
import { LET } from '../instructions/let';
import { RETURN } from '../instructions/return';
import { catchError, concatMap, delay, filter, map, shareReplay, take, takeWhile, tap } from 'rxjs/operators';
import { FORI } from '../instructions/fori';
import { Method } from '../instructions/method';
import { CALL } from '../instructions/call';
import { SteppableProgram } from '../instructions/steppable-program';
import { Field } from '../instructions/field';
import { isTreeExport, TreeExport } from '../../dto/tree-export';
import { StaticInject } from '../../../util/lifecycle/static-injector';
import { BreakpointService } from '../../breakpoint.service';

export class Runtime implements ReadWriteProvider {
  @StaticInject(BreakpointService)
  private breakpointService: BreakpointService;

  private ___immediate_return: unknown;
  get active(): boolean {
    return this._active$.getValue();
  }

  set active(value: boolean) {
    this._active$.next(value);
  }
  get halted(): boolean {
    return this._halted$.getValue();
  }

  set halted(value: boolean) {
    this._halted$.next(value);
  }

  private readonly methods = new Map<string, Method>();
  private readonly _methodsChanged$ = new ReplaySubject<void>(1);
  public readonly methods$ = this._methodsChanged$.pipe(
    map(() => this.methods),
    shareReplay(1)
  );

  private readonly _active$ = new BehaviorSubject<boolean>(false);
  public readonly active$ = this._active$.asObservable();

  private readonly _halted$ = new BehaviorSubject<boolean>(false);
  public readonly halted$ = this._active$.asObservable();

  private readonly _terminated$ = new ReplaySubject<void>(1);
  public readonly terminated$ = this._terminated$.asObservable();

  private readonly _error$ = new ReplaySubject<Error>(1);
  public readonly error$ = this._error$;

  private stepOverVal = false;
  private haltOverride = false;

  private program: SteppableProgram;

  private tick$ = interval(this.tickTime).pipe(
    filter(() => (this.active && !this.halted) || this.breakpointService.areBreakpointsHidden())
  );
  private instructionStack: InstrStackFrame[] = [];
  private memStack: MemStackFrame[] = [];

  public constructor(private readonly tickTime) {
    this.memStack.push(new MemStackFrame(null, 'base')); // TODO wird die base mögl. entfernt?
    this.tick$
      .pipe(
        tap(() => {
          this.executeHighest();
        }),
        catchError((err, obs) => {
          Object.freeze(this.memStack);
          Object.freeze(this.instructionStack);
          console.log(this.memStack);
          console.log(this.instructionStack);
          this.active = false;
          this.halted = false;
          this.terminate();
          console.error(err);
          this._error$.next(err);

          return of();
        })
      )
      .subscribe();
  }

  public start(): void {
    this.active = true;
    this.halted = false;
  }

  public terminate(): void {
    this.active = false;
    this.halted = false;
    this.instructionStack = [];
    // this.memStack = [];
    this._terminated$.next();
  }

  public clearState(): void {
    this.active = false;
    this.halted = false;
    this.instructionStack = [];
    this.memStack = [];
    this.methods.clear();
    this._methodsChanged$.next();
  }

  public pause(): void {
    this.halted = true;
  }

  public resume(): void {
    this.halted = false;
    // this.instructionStack[this.instructionStack.length - 1].instruction.setBreakpoint(false);
    this.executeHighest(true);
  }

  public stepOver(): void {
    if (this.halted) {
      this.executeHighest(true);
      // this.instructionStack[this.instructionStack.length - 2].instruction.virtualBreakpoint = true;
      // this.halted = false;
    }
  }

  public queue(instruction: Instruction): Observable<any> {
    const frame = new InstrStackFrame(instruction);
    this.instructionStack.unshift(frame);
    return frame.ready$;
  }

  public callMethod(methodName: string, args: Map<string, unknown>): Observable<any> {
    const call = new CALL({
      methodName: methodName,
      arguments: () => args,
      writeReturnValueInto: '___IMMEDIATE_RETURN',
    });
    const frame = new InstrStackFrame(call);
    this.instructionStack.unshift(frame);
    let ret = undefined;
    this.instructionStack.unshift(
      new InstrStackFrame(
        new RUN((rw) => {
          ret = rw.readVariable('___IMMEDIATE_RETURN');
        })
      )
    ); // take the returned value
    this.start();
    return frame.ready$.pipe(
      map(() => {
        return ret;
      })
    );
  }

  public executeHighest(ignoreBreakPoints = false): void {
    // this.logStack();
    if (this.instructionStack.length === 0) {
      this.terminate();
      return;
    }

    const frame = this.instructionStack[this.instructionStack.length - 1];

    const instr = frame.instruction;
    const ready$ = frame.ready$;

    instr.setActive(true);
    if (instr.isBreakpointEnabled() && !ignoreBreakPoints) {
      this.pause();
      return;
    }

    ready$.pipe(take(1), delay(10)).subscribe(() => {
      instr.setActive(false);
    });

    if (instr instanceof RUN) {
      instr.getCode()?.(this);
      this.instructionStack.pop();
      ready$.next();
    } else if (instr instanceof IF) {
      const condition = instr.evaluateCondition(this);
      this.instructionStack.pop();
      if (condition) {
        this.instructionStack.push(
          ...instr
            .getIfBody()
            .map((i) => new InstrStackFrame(i))
            .reverse()
        );
        this.instructionStack.push(new InstrStackFrame(new RUN(() => ready$.next()))); // helper so the ready is resolved when all instructions are done
      } else {
        ready$.next();
      }
    } else if (instr instanceof WHILE) {
      const curMemStack = this.memStack[this.memStack.length - 1];
      const condition = instr.evaluateCondition(this);
      if (condition) {
        // memory from previous round
        if (curMemStack.source === instr) {
          this.memStack.pop();
        }

        this.memStack.push(new MemStackFrame(instr));
        this.instructionStack.push(
          ...instr
            .getBody()
            .map((i) => new InstrStackFrame(i))
            .reverse()
        );
      } else {
        if (curMemStack.source === instr) {
          this.memStack.pop();
        }
        ready$.next();
        this.instructionStack.pop();
      }
    } else if (instr instanceof LET) {
      this.declareVariable(instr.getDeclaredName(), instr.getValue(this));
      this.instructionStack.pop();
      ready$.next();
    } else if (instr instanceof FORI) {
      // Todo this is not yet compliant with specification
      const curMemStack = this.memStack[this.memStack.length - 1];
      if (curMemStack.source !== instr) {
        this.memStack.push(new MemStackFrame(instr));
        this.declareVariable(instr.getIteratorName(), instr.getStartValue(this));
      }
      const condition = instr.evaluateCondition(this, this.readVariable(instr.getIteratorName()));

      const itName = instr.getIteratorName();
      this.instructionStack.push(
        new InstrStackFrame(
          new RUN((rw) => {
            // push onto stack so this is executed after each loop
            this.writeVariable(itName, this.readVariable<number>(itName) + instr.getStepSize(rw));
          })
        )
      );
      if (condition) {
        this.instructionStack.push(
          ...instr
            .getBody()
            .map((i) => new InstrStackFrame(i))
            .reverse()
        );
      } else {
        if (curMemStack.source === instr) {
          this.memStack.pop();
          ready$.next();
        }
        this.instructionStack.pop(); // two times because there is the instruction to increment
        this.instructionStack.pop();
      }
    } else if (instr instanceof RETURN) {
      const returnValue = instr.getReturnValue(this);
      while (!(this.getTopOfStack()?.instruction instanceof CALL)) {
        const frame = this.instructionStack.pop();
        if (!frame) {
          break;
        }
        if (this.memStack[this.memStack.length - 1].source === frame.instruction) {
          this.memStack.pop();
        }
      }
      this.declareVariable('return', returnValue);
      ready$.next();
    } else if (instr instanceof Method) {
      this.methods.set(instr.getName(), instr);
      this._methodsChanged$.next();
      this.instructionStack.pop();
      ready$.next();
    } else if (instr instanceof CALL) {
      const isReturning = instr === this.memStack[this.memStack.length - 1]?.source;
      if (isReturning) {
        // cleaning up
        console.log([...this.memStack]);
        this.instructionStack.pop();
        const droppedFrame = this.memStack.pop();
        const writeInto = instr.getWriteReturnValueIntoName();
        if (writeInto) {
          this.writeVariable(writeInto, droppedFrame.declarations.get('return'));
        }
        ready$.next();
      } else {
        // Calling the method
        const methodName = instr.getMethodName();
        const method = this.methods.get(methodName);
        if (!method) {
          throw new Error(`Method '${methodName}' does not exist!`);
        }

        const argNames = method.getArgumentNames();
        const args = instr.getArguments(this);

        this.memStack.push(new MemStackFrame(instr));
        argNames.forEach((k) => {
          this.declareVariable(k, args.get(k));
        });

        const instructions = method
          .getInstructions()
          .map((i) => new InstrStackFrame(i))
          .reverse();

        this.instructionStack.push(...instructions);
      }
    } else if (instr instanceof Field) {
      this.instructionStack.pop();
      const baseMem = this.memStack[0];
      if (!baseMem) {
        throw new Error('Wtf no memory stack frame at position 0?');
      }

      if (baseMem.declarations.has(instr.getName())) {
        throw new Error('Field ' + instr.getName() + ' has already been declared!');
      }

      baseMem.declarations.set(instr.getName(), instr.getValue());
      ready$.next();
    }
  }

  postDecr(varName: string): number {
    return 0;
  }

  postIncr(varName: string): number {
    return 0;
  }

  declareVariable<T>(varName: string, value: T): void {
    const frame = this.memStack[this.memStack.length - 1];
    if (!frame) {
      throw new Error('Stack is too shallow');
    }
    if (frame.declarations.has(varName)) {
      throw new Error(`Variable '${varName}' is already declared in this scope`);
    }
    frame.declarations.set(varName, value);
  }

  readVariable<T>(varName: string): T {
    if (varName === '___IMMEDIATE_RETURN') {
      return this.___immediate_return as T;
    }

    for (let i = this.memStack.length - 1; i >= 0; i--) {
      const frame = this.memStack[i];
      if (frame.declarations.has(varName)) {
        return frame.declarations.get(varName) as T;
      }
    }
    throw new Error(`Variable '${varName}' is not defined!`);
  }

  writeVariable<T>(varName: string, value: T): void {
    if (varName === '___IMMEDIATE_RETURN') {
      this.___immediate_return = value;
      return;
    }

    for (let i = this.memStack.length - 1; i >= 0; i--) {
      const frame = this.memStack[i];
      if (frame.declarations.has(varName)) {
        frame.declarations.set(varName, value);
        return;
      }
    }
    throw new Error(`Variable '${varName}' is not defined!`);
  }

  private getTopOfStack(): InstrStackFrame {
    if (this.instructionStack.length === 0) {
      return undefined;
    }
    return this.instructionStack[this.instructionStack.length - 1];
  }

  public setProgram(program: SteppableProgram): void {
    this.program = program;
    program.getFields().forEach((field) => {
      this.queue(field);
    });

    program.getMethods().forEach((method) => {
      this.queue(method);
    });
  }

  private logStack(): void {
    console.log('###############################');
    console.log(
      'IS',
      this.instructionStack.map((e) => e.instruction.getDescription())
    );
    console.log(
      'MS',
      this.memStack.map((e) => e.name),
      this.memStack.map((e) => [...e.declarations.entries()])
    );
  }

  public createSnapshot(): TreeExport {
    const snapshot = this.program.createSnapshot();
    if (isTreeExport(snapshot)) {
      return snapshot;
    }
    return undefined;
  }

  public applySnapshot(snapshot: TreeExport): void {
    const importInstructions = this.program.getInstructionsForImport(snapshot);
    const instructions = importInstructions.map((i: Method, idx) => {
      const map = new Map<string, number>();
      map.set('key', snapshot.elements[idx]);
      return { method: i, args: map };
    });

    instructions.forEach((i) => {
      this.callMethod(i.method.getName(), i.args);
    });
  }
}

class InstrStackFrame {
  public readonly ready$ = new ReplaySubject<any>(1);

  public constructor(public readonly instruction: Instruction) {}
}

class MemStackFrame {
  public readonly declarations = new Map<string, unknown>();
  public constructor(public source: Instruction, public name = 'new Frame') {}
}
