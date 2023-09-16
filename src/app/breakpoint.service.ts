import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BreakpointService {
  private breakpointsHidden$ = new BehaviorSubject<boolean>(false);

  constructor() {}
  public toggleBreakpointsHidden(): void {
    this.breakpointsHidden$.next(!this.breakpointsHidden$.getValue());
  }

  public areBreakpointsHidden(): boolean {
    return this.breakpointsHidden$.getValue();
  }

  public areBreakpointsHidden$(): Observable<boolean> {
    return this.breakpointsHidden$;
  }
}
