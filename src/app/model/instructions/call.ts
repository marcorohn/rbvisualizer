import { Instruction } from './instruction';
import { Steppable } from './steppable';
import { ReadWriteProvider } from '../readwriteprovider';

export class CALL extends Instruction {
  public constructor(
    protected config: {
      methodName: string;
      arguments: (rw: ReadWriteProvider) => Map<string, any>;
      writeReturnValueInto?: string;
    }
  ) {
    super();
  }

  getChildren(): Steppable[] {
    return [];
  }

  isNestable(): boolean {
    return false;
  }

  public getMethodName(): string {
    return this.config.methodName;
  }

  public getArguments(rw: ReadWriteProvider): Map<string, any> {
    return this.config.arguments(rw);
  }

  public getDescription(): string {
    return this.config.methodName + '(?)';
  }

  public getWriteReturnValueIntoName(): string {
    return this.config.writeReturnValueInto;
  }

  public toString(): string {
    return this.getDescription();
  }
}
