export interface ReadWriteProvider {
  readVariable<T>(varName: string): T;
  writeVariable<T>(varName: string, value: T): void;
  postIncr(varName: string): number;
  postDecr(varName: string): number;
}
