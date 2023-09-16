import { Steppable } from './steppable';
import { Instruction } from './instruction';
import { TypeOfType } from '../../../util/types/typeof';

export class Method extends Instruction {
  public constructor(
    private config: {
      name: string;
      argNames: string[];
      argTypes?: TypeOfType[];
      instructions: Instruction[];
      public?: boolean;
    }
  ) {
    super();
    this.isTopLevel = true;
    this.userRunnable = this.userRunnable && config.public;
  }

  public getName(): string {
    return this.config.name;
  }

  public getInstructions(): Instruction[] {
    return this.config.instructions;
  }

  public getChildren(): Steppable[] {
    return this.getInstructions();
  }

  public toString(): string {
    return `${String(this.getName())}(${this.getArgumentNames().join(', ')})`;
  }

  public isNestable(): boolean {
    return true;
  }

  public getArgumentNames(): string[] {
    return this.config.argNames;
  }

  public getArgumentTypes(): TypeOfType[] {
    return this.config.argTypes;
  }

  getArgumentNamesString(): string {
    return this.getArgumentNames().join(', ');
  }
}
