import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { Steppable } from './steppable';
import { ReadWriteProvider } from '../readwriteprovider';

export const DESCRIBE = {
  METHOD: {
    NAME: '%methodname',
  },
  FIELD: {
    NAME: '%fieldname',
  },
  LET: {
    NAME: '%letname',
    MAKE: (assignedValue: string) => `let ${DESCRIBE.LET.NAME} = ${assignedValue};`,
    READFROM: (assignedValue: string) => `let ${DESCRIBE.LET.NAME} = ${assignedValue};`,
  },
  FORI: {
    IT_NAME: '%fori_itname',
    STARTVAL: '%fori_startval',
    STEPSIZE: '%fori_stepsize',
    MAKE: (conditionDescription: string) =>
      `for (let ${DESCRIBE.FORI.IT_NAME} = ${DESCRIBE.FORI.STARTVAL}; ${conditionDescription}; ${DESCRIBE.FORI.IT_NAME} += ${DESCRIBE.FORI.STEPSIZE})`,
  },
  IF: {
    MAKE: (conditionDescription: string) => `if (${conditionDescription})`,
  },
  IF_ELSE: {
    SEPERATOR: '____IF_ELSE_SEP____',
    MAKE: (conditionDescription: string) => `if (${conditionDescription})${DESCRIBE.IF_ELSE.SEPERATOR}else`,
  },
  WHILE: {
    MAKE: (conditionDescription: string) => `while(${conditionDescription})`,
  },
};

export abstract class Instruction implements Steppable {
  public isTopLevel: boolean = false;
  private description: string = '';
  protected readonly _breakpointEnabled$ = new BehaviorSubject<boolean>(false);
  public readonly breakpointEnabled$ = this._breakpointEnabled$.pipe(shareReplay(1));
  public active$ = new BehaviorSubject<boolean>(false);
  public userRunnable = true;

  public virtualBreakpoint = false;

  protected constructor() {
    this.description = Object.getPrototypeOf(this).constructor.name;
  }

  public getCode(): (rw: ReadWriteProvider, ...args: any[]) => unknown {
    return null;
  }

  public abstract getChildren(): Steppable[];

  public setDescription(description): this {
    this.description = description;
    return this;
  }

  public getDescription(): string {
    return this['config']?.description ?? this.description; // I should be shot for this
  }

  public setBreakpoint(enabled: boolean): this {
    this._breakpointEnabled$.next(enabled);
    return this;
  }

  public isBreakpointEnabled(): boolean {
    return this._breakpointEnabled$.getValue();
  }

  public isBreakpointEnabled$(): Observable<boolean> {
    return this.breakpointEnabled$;
  }

  public isActive(): boolean {
    return this.active$.getValue();
  }

  public setActive(val: boolean): void {
    this.active$.next(val);
  }

  public abstract isNestable(): boolean;
}
