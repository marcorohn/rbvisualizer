import { Instruction } from './instruction';
import { Steppable } from './steppable';

export class Field<T = unknown> extends Instruction {
  public constructor(
    private config: {
      name: string;
      value: T;
    }
  ) {
    super();
  }

  public getName(): string {
    return this.config.name;
  }

  public getValue(): T {
    return this.config.value;
  }

  getChildren(): Steppable[] {
    return [];
  }

  isNestable(): boolean {
    return false;
  }
}
