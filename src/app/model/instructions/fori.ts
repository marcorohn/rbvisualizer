import { Instruction, DESCRIBE } from './instruction';
import { Steppable } from './steppable';
import { ConditionalInstruction } from './conditional';
import { ReadWriteProvider } from '../readwriteprovider';

export class FORI extends ConditionalInstruction {
  public constructor(
    protected config: {
      iStartVal: number | ((rw: ReadWriteProvider) => number);
      condition: (rw: ReadWriteProvider, i: number) => boolean;
      stepSize: number | ((rw: ReadWriteProvider) => number);
      iteratorName?: string;
      body: Instruction[];
    }
  ) {
    super(config);
  }

  public getCode(): (rw: ReadWriteProvider, i: number) => unknown {
    return this.config.condition;
  }

  public evaluateCondition(rw: ReadWriteProvider, i: number): boolean {
    return this.config.condition(rw, i);
  }

  public getStartValue(rw: ReadWriteProvider): number {
    return typeof this.config.iStartVal === 'function' ? this.config.iStartVal(rw) : this.config.iStartVal;
  }

  public getStepSize(rw: ReadWriteProvider): number {
    return typeof this.config.stepSize === 'function' ? this.config.stepSize(rw) : this.config.stepSize;
  }

  public getBody(): Instruction[] {
    return this.config.body;
  }

  public getIteratorName(): string {
    return this.config.iteratorName ?? 'i';
  }

  public toString(): string {
    return this.getDescription()
      .replace(DESCRIBE.FORI.IT_NAME, this.getIteratorName())
      .replace(DESCRIBE.FORI.IT_NAME, this.getIteratorName())
      .replace(
        DESCRIBE.FORI.STEPSIZE,
        typeof this.config.stepSize === 'number' ? this.config.stepSize + '' : '() => number'
      )
      .replace(
        DESCRIBE.FORI.STARTVAL,
        typeof this.config.iStartVal === 'number' ? this.config.iStartVal + '' : '() => number'
      );
  }

  public getChildren(): Steppable[] {
    return this.getBody();
  }

  public isNestable(): boolean {
    return true;
  }
}
