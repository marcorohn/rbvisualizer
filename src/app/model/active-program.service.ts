import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProgramContext } from './context/program-context';
import { SteppableProgram } from './instructions/steppable-program';
import { distinctUntilChanged, map, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ActiveProgramService {
  private programContext: ProgramContext = null;
  private readonly program$ = new BehaviorSubject<SteppableProgram>(null);
  private readonly programContext$ = this.program$.pipe(
    map((p) => {
      if (!p) {
        this.programContext = null;
      } else {
        this.programContext = new ProgramContext(p);
      }
      return this.programContext;
    }),
    distinctUntilChanged(),
    shareReplay(1)
  );

  constructor() {}

  public getActiveProgram(): SteppableProgram | undefined {
    return this.program$.getValue();
  }

  public getActiveProgram$(): Observable<SteppableProgram> {
    return this.program$;
  }

  public setActiveProgram(program: SteppableProgram): void {
    this.program$.next(program);
  }

  public getActiveProgramContext$(): Observable<ProgramContext> {
    return this.programContext$;
  }

  public getActiveProgramContext(): ProgramContext {
    return this.programContext;
  }
}
