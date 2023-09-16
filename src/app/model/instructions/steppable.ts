import { Observable } from 'rxjs';
import { ReadWriteProvider } from '../readwriteprovider';

export type Runnable = (rw: ReadWriteProvider, ...args: unknown[]) => void;
export type Predicate = (rw: ReadWriteProvider) => boolean;

export interface Steppable {
  toString(): string;
  getDescription(): string;
  isBreakpointEnabled(): boolean;
  breakpointEnabled$: Observable<boolean>;
  setBreakpoint(enabled: boolean): void;
  getChildren(): Steppable[];
  isTopLevel: boolean;
  isActive(): boolean;
  active$: Observable<boolean>;
  userRunnable?: boolean;
}
