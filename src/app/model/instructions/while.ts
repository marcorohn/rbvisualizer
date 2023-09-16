import { ConditionalInstruction } from './conditional';
import { Predicate, Steppable } from './steppable';
import { DESCRIBE, Instruction } from './instruction';

export class WHILE extends ConditionalInstruction {
  public constructor(protected override config: { description?: string; condition: Predicate; body: Instruction[] }) {
    super(config);
  }

  public getBody(): Instruction[] {
    return this.config.body;
  }

  public toString(): string {
    return this.getDescription();
  }

  public override getChildren(): Steppable[] {
    return this.getBody();
  }

  public isNestable(): boolean {
    return true;
  }
}
