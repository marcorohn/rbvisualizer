import { Instruction, DESCRIBE } from './instruction';
import { Runnable, Steppable } from './steppable';

export class RUN extends Instruction {
  public constructor(protected readonly fn: Runnable) {
    super();
  }

  public override getCode(): Runnable {
    return this.fn;
  }

  public toString(): string {
    return this.getDescription();
  }

  getChildren(): Steppable[] {
    return [];
  }

  public isNestable(): boolean {
    return false;
  }
}
