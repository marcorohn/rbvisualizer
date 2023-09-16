import { Injectable } from '@angular/core';
import { Runtime } from './model/context2/runtime';

@Injectable({
  providedIn: 'root',
})
export class RuntimeService {
  private readonly runtime = new Runtime(1);
  constructor() {}

  public getRuntime(): Runtime {
    return this.runtime;
  }
}
