import { Container } from '../model/container';

export class LinkedList<T> {
  private root: LLContainer<T>;
  private size: number = 0;

  public getSize(): number {
    return this.size;
  }

  public add(element: T): void {
    if (!this.root) {
      this.root = new LLContainer<T>(element);
      this.size++;
      return;
    }

    let cursor = this.root;
    while (cursor.getSuccessor()) {
      cursor = cursor.getSuccessor();
    }
    const newContainer = new LLContainer(element);
    cursor.setSuccessor(newContainer);
    this.size++;
  }

  public addIndex(element: T, index: number): void {
    if (index > this.getSize()) {
      index = this.getSize();
    }

    let cursor = this.root;
    let predecessor: LLContainer<T> = null;
    // skip to point of interest
    for (let i = 0; i < index; i++) {
      predecessor = cursor;
      cursor = cursor.getSuccessor();
    }

    const newContainer = new LLContainer(element);
    if (index === 0) {
      newContainer.setSuccessor(this.root);
      this.root = newContainer;
    } else {
      predecessor.setSuccessor(newContainer);
      newContainer.setSuccessor(cursor);
    }
    this.size++;
  }

  public remove(element: T): void {
    let cursor = this.root;
    let predecessor: LLContainer<T> = null;
    while (cursor) {
      if (cursor.getElement() === element) {
        if (cursor === this.root) {
          // special case for first element
          this.root = cursor?.getSuccessor();
        } else {
          predecessor?.setSuccessor(cursor?.getSuccessor());
        }
        this.size--;
      }

      predecessor = cursor;
      cursor = cursor.getSuccessor();
    }
  }

  public get(index: number): T {
    if (index >= this.size || index < 0) {
      return null;
    }

    let cursor = this.root;
    for (let i = 0; i < index; i++) {
      cursor = cursor.getSuccessor();
    }
    return cursor.getElement();
  }

  public contains(element: T): boolean {
    let cursor = this.root;
    while (cursor) {
      if (cursor.getElement() === element) {
        return true;
      }
      cursor = cursor.getSuccessor();
    }
    return false;
  }

  public clear(): void {
    this.root = null;
    this.size = 0;
  }

  public toArray(): T[] {
    const arr: T[] = [];

    let cursor = this.root;
    while (cursor) {
      arr.push(cursor.getElement());
      cursor = cursor.getSuccessor();
    }

    return arr;
  }
}

export class LLContainer<T> extends Container<T> {
  private successor: LLContainer<T>;
  public constructor(element: T) {
    super(element);
  }

  public setSuccessor(succ: LLContainer<T>): void {
    this.successor = succ;
  }

  public getSuccessor(): LLContainer<T> {
    return this.successor;
  }
}
