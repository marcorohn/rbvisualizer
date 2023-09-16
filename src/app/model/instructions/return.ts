import { Instruction } from './instruction';
import { Steppable } from './steppable';
import { ReadWriteProvider } from '../readwriteprovider';

export class RETURN extends Instruction {
  public constructor(protected config: { returnVal?: (rw: ReadWriteProvider) => unknown }) {
    super();
  }

  public getReturnValue(rw: ReadWriteProvider): unknown {
    return this.config.returnVal?.(rw);
  }

  public toString(): string {
    return 'RETURN';
  }

  getChildren(): Steppable[] {
    return [];
  }

  public isNestable(): boolean {
    return false;
  }
}
