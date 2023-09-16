import { Field } from './field';
import { Method } from './method';
import { Instruction } from './instruction';
import { Steppable } from './steppable';

interface ProgramImplementation {
  fields: Field[];
  methods: Method[];
}
export class SteppableProgram extends Instruction {
  private config: ProgramImplementation = { fields: [], methods: [] };
  private createSnapshotAction: () => unknown = () => {
    alert('no create snapshot action set!');
  };

  private applySnapshotAction: (snapshot) => Instruction[] = () => {
    alert('no apply snapshot action is set');
    return [];
  };
  public constructor() {
    super();
  }

  public getMethod(name: string) {
    return this.config.methods.find((m) => m.getName() === name);
  }

  public getMethods(): Method[] {
    return this.config.methods;
  }

  public getFields(): Field[] {
    return this.config.fields;
  }

  public getChildren(): Steppable[] {
    return this.config.methods;
  }

  public implement(impl: ProgramImplementation): void {
    this.config = impl;
  }

  public isNestable(): boolean {
    return true;
  }

  public setOnCreateSnapshot(action: () => unknown) {
    this.createSnapshotAction = action;
  }

  public setOnApplySnapshot(action: (snapshot) => Instruction[]) {
    this.applySnapshotAction = action;
  }

  public createSnapshot(): unknown {
    return this.createSnapshotAction();
  }

  public getInstructionsForImport(snapshot: unknown): Instruction[] {
    return this.applySnapshotAction(snapshot);
  }
}
