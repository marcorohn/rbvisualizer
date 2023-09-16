import { Directive, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Utility base component to implement a destroy$ observable to use in {@link takeUntil}-Operator.
 */
@Directive()
export abstract class LifecycleComponent implements OnDestroy {
  protected readonly destroy$: Subject<void> = new Subject<void>();

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public takeUntil<T>(source: Observable<T>): Observable<T> {
    if (typeof source.pipe !== 'function') {
      console.error({ message: 'source.pipe is not a function', source: source });
    }
    return source.pipe(takeUntil(this.destroy$));
  }
}
