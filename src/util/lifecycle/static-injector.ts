import { Injectable } from './constructable';
import { Injector } from '@angular/core';

export interface TestProvider<T> {
  type: new (...args) => T;
  methods: string[];
  instance?: T;
}

export class StaticInjector {
  private static _inj: Injector;

  static init(injector: Injector) {
    this._inj = injector;
  }

  static inject<T>(component: Injectable<T>): T {
    return this._inj.get<T>(component);
  }

  static injectAll<T1>(comp1: Injectable<T1>): [T1];
  static injectAll<T1, T2>(comp1: Injectable<T1>, comp2: Injectable<T2>): [T1, T2];
  static injectAll<T1, T2, T3>(comp1: Injectable<T1>, comp2: Injectable<T2>, comp3: Injectable<T3>): [T1, T2, T3];
  static injectAll<T1, T2, T3, T4>(
    comp1: Injectable<T1>,
    comp2: Injectable<T2>,
    comp3: Injectable<T3>,
    comp4: Injectable<T4>
  ): [T1, T2, T3, T4];
  static injectAll<T1, T2, T3, T4, T5>(
    comp1: Injectable<T1>,
    comp2: Injectable<T2>,
    comp3: Injectable<T3>,
    comp4: Injectable<T4>,
    comp5: Injectable<T5>
  ): [T1, T2, T3, T4, T5];
  static injectAll<T1, T2, T3, T4, T5, T6>(
    comp1: Injectable<T1>,
    comp2: Injectable<T2>,
    comp3: Injectable<T3>,
    comp4: Injectable<T4>,
    comp5: Injectable<T5>,
    comp6: Injectable<T6>
  ): [T1, T2, T3, T4, T6];
  static injectAll(...components: Injectable<unknown>[]): unknown[] {
    return components.map((comp) => this._inj.get(comp));
  }

  static testInit(providers: TestProvider<unknown>[]) {
    providers.forEach((prov) => {
      prov.instance = prov.methods.reduce((obj, methodName) => {
        return {
          ...obj,
          [methodName]: () => {},
        };
      }, {});
    });
    this._inj = {
      get: function <T>(token: new (...args) => T): T {
        const provider = providers.find((prov) => {
          return prov.type === token;
        });
        return (provider ? provider.instance : {}) as T;
      },
    } as unknown as Injector;
  }
}

export function StaticInject<T>(component: Injectable<T>) {
  return function (target: unknown, propertyName): void {
    if (delete target[propertyName]) {
      // Create new property with getter and setter
      Object.defineProperty(target, propertyName, {
        get: () => StaticInjector.inject(component),
        set: () => {
          throw new Error('trying to override readonly static injected field ' + propertyName);
        },
        enumerable: false,
        configurable: false,
      });
    }
  };
}
