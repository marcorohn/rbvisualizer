import { Instruction, DESCRIBE } from './instruction';
import { Steppable } from './steppable';
import { ReadWriteProvider } from '../readwriteprovider';

export class LET extends Instruction {
  public constructor(
    protected config: {
      description?: string;
      name: string;
      value: (rw: ReadWriteProvider) => unknown;
    }
  ) {
    super();
  }

  public getDeclaredName(): string {
    return this.config.name;
  }

  public getValue<T>(rw: ReadWriteProvider): T {
    return this.config.value(rw) as T;
  }

  public toString(): string {
    return this.getDescription().replace(DESCRIBE.LET.NAME, this.config.name);
  }

  getChildren(): Steppable[] {
    return [];
  }

  public isNestable(): boolean {
    return false;
  }
}
