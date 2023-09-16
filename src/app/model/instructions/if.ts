import { ConditionalInstruction } from './conditional';
import { Predicate, Steppable } from './steppable';
import { Instruction, DESCRIBE } from './instruction';
import { ReadWriteProvider } from '../readwriteprovider';

export class IF extends ConditionalInstruction {
  public constructor(protected override config: { description?: string; condition: Predicate; body: Instruction[] }) {
    super(config);
  }

  public getCode(): (rw: ReadWriteProvider) => unknown {
    return this.config.condition;
  }

  public getIfBody(): Instruction[] {
    return this.config.body;
  }

  public getChildren(): Steppable[] {
    return this.getIfBody();
  }

  public toString(): string {
    return this.getDescription();
  }

  public isNestable(): boolean {
    return true;
  }
}
