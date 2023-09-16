import { Observable } from 'rxjs';

declare module 'rxjs' {
  /**
   * This will return the "current value" of an observable immediately, or {@code null} if the observable does not instantly emit a value.
   * You can use this Code to use Observables in a synchronous context, but be careful, as this is not the main use case of observables.
   */
  interface Observable<T> {
    immediate(): T | null;
  }
}

if (Observable.prototype.hasOwnProperty('immediate')) {
  throw new Error('You must not import immediate.ts twice.');
}

Observable.prototype.immediate = function (): unknown {
  let returnValue = null;
  this.subscribe((val) => (returnValue = val)).unsubscribe();
  return returnValue;
};

// There is no typing for this, because you shouldn't use it in actual code
// Only used to show the current value of an Observable in the developer console
Object.defineProperty(Observable.prototype, 'θimmediateValue', {
  get(): string {
    return this.immediate() ?? '<none>';
  },
  enumerable: true,
});
