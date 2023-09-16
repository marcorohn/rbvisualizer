export abstract class Container<T> {
  protected constructor(protected element: T) {}

  public getElement(): T {
    return this.element;
  }
}
