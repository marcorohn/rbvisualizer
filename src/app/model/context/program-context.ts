import { Context } from './context';
import { Method } from '../instructions/method';
import { BehaviorSubject, from, interval, Observable, ReplaySubject } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { SteppableProgram } from '../instructions/steppable-program';
import { toNumberIfPossible } from '../../../util/number';
import { isTreeExport, TreeExport } from '../../dto/tree-export';

export class ProgramContext extends Context {
  protected readonly _ready$ = new BehaviorSubject<boolean>(true);
  public readonly ready$ = this._ready$.asObservable();

  // TODO this could be improved
  public readonly halted$ = this.ready$.pipe(map((e) => !e));
  public readonly stack$ = new ReplaySubject<Context[]>(1);

  public constructor(instr: SteppableProgram) {
    super(instr);
    instr.getFields().forEach((field) => {
      const val = toNumberIfPossible(field.getValue());
      this.declareVariable(field.getName(), val);
    });
  }
  public runMethod(name: string, args: Map<string, unknown>): Observable<any> {
    const returnVal$ = new ReplaySubject<any>(1);
    const defer = () => {
      this.instr.setActive(false);
      this.children = [];
      this._ready$.next(true);
      this.stack$.next([]);
    };

    this._ready$.next(false);

    // find the method which should be executed
    const method = this.instr
      .getChildren()
      .filter((e) => e instanceof Method)
      .map((e) => e as Method)
      .find((e) => (e as Method).getName() === name);

    // prepare new execution context
    const methodCtx = new Context(method);

    // declare variables coming from argument list
    args.forEach((v, k) => {
      methodCtx.declareVariable(k, v);
    });

    // set this context as child
    this.setChildren([methodCtx]);
    this.instr.setActive(true);

    // clean up once method is over
    methodCtx.onExit$().subscribe((res) => {
      console.log(res);
      if (res.returnVal !== undefined) {
        returnVal$.next(res.returnVal);
      }
      returnVal$.complete();
      defer();
    });

    methodCtx.execute();
    return returnVal$;
  }
  public resume(): void {
    const active = this.findDeepestActive();
    if (active) {
      active['___selfResume$'].next(); // wtf why does the compiler not want me to do that
    }
  }

  public stepOver(): void {
    const path = this.findDeepestActivePath();
    if (path.length < 1) {
      return;
    }

    const current = path[path.length - 1];
    const parent = current.getParent();
    const idx = parent.getChildren().findIndex((e) => e === current);
    const nextContext = parent.getChildren()[idx + 1];
    if (nextContext) {
      nextContext.setVirtualBreakpoint(true);
    } else if (parent.getChildren()[idx] === current && path.length >= 3) {
      const grandparent = parent.getParent();
      if (grandparent) {
        const parentIdx = grandparent.getChildren().findIndex((e) => e === parent);
        const overNextContext = grandparent.getChildren()[parentIdx + 1];
        if (overNextContext) {
          overNextContext.setVirtualBreakpoint(true);
        }
      }
    }
    current['___selfResume$'].next();
  }

  public onRefresh() {
    const path = this.findDeepestActivePath();
    const deepest = path[path.length - 1];

    if (deepest && !deepest.isNested()) {
      this.stack$.next(path.slice(0, path.length - 1));
    } else {
      this.stack$.next(path);
    }
  }

  public createSnapshot(): TreeExport {
    const snapshot = (this.instr as SteppableProgram).createSnapshot();
    if (isTreeExport(snapshot)) {
      return snapshot;
    }
    return undefined;
  }

  public applySnapshot(snapshot: TreeExport): void {
    const importInstructions = (this.instr as SteppableProgram).getInstructionsForImport(snapshot);
    const instructions = importInstructions.map((i: Method, idx) => {
      const map = new Map<string, number>();
      map.set('key', snapshot.elements[idx]);
      return { method: i, args: map };
    });

    from(instructions)
      .pipe(concatMap((e) => this.runMethod(e.method.getName(), e.args)))
      .subscribe();
  }
}
