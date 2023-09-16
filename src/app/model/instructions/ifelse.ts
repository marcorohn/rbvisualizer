import { ConditionalInstruction } from './conditional';
import { Predicate, Steppable } from './steppable';
import { Instruction } from './instruction';

export class IF_ELSE extends ConditionalInstruction {
  public constructor(
    protected override config: { condition: Predicate; ifBody: Instruction[]; elseBody: Instruction[] }
  ) {
    super(config);
  }

  public getIfBody(): Instruction[] {
    return this.config.ifBody;
  }

  public getElseBody(): Instruction[] {
    return this.config.elseBody;
  }

  public toString(): string {
    return 'IF ELSE';
  }

  getChildren(): Steppable[] {
    return [];
  }

  public isNestable(): boolean {
    return true;
  }
}
