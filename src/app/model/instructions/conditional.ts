import { Instruction } from './instruction';
import { Predicate } from './steppable';
import { ReadWriteProvider } from '../readwriteprovider';

export abstract class ConditionalInstruction extends Instruction {
  protected constructor(
    protected config: { description?: string; condition: (rw: ReadWriteProvider, i: number) => boolean }
  ) {
    super();
  }
  public evaluateCondition(rw: ReadWriteProvider, ...args: unknown[]): boolean {
    return this.config.condition(rw, args[0] as number);
  }

  public isNestable(): boolean {
    return true;
  }
}
