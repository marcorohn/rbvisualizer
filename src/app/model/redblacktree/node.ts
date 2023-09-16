import { BLACK } from './color';
import { Cell, Graph } from '@maxgraph/core';

export class Node {
  mxNode: Cell;

  data: number;
  private _left: Node;
  private _right: Node;

  get left(): Node {
    return this._left;
  }

  get right(): Node {
    return this._right;
  }

  set left(newLeft: Node) {
    this._left = newLeft;
  }

  set right(newRight: Node) {
    this._right = newRight;
  }

  private _parent: Node;

  get parent(): Node {
    return this._parent;
  }

  set parent(newParent: Node) {
    // first delete old connection
    const toDelete = this.mxNode.getOutgoingEdges().filter((edge) => edge.target === this.parent?.mxNode);
    this.graph.removeCells(toDelete);

    this._parent = newParent;

    if (newParent) {
      const cell = this.graph.insertEdge(null, null, 'parent', this.mxNode, newParent.mxNode, {
        verticalLabelPosition: 'bottom',
      });
    }
    this.graph.refresh();
  }

  private _color: boolean;

  get color(): boolean {
    return this._color;
  }

  set color(newColor: boolean) {
    if (newColor !== this._color) {
      const style = this.mxNode.getStyle();
      style.fillColor = newColor === BLACK ? 'black' : 'red';
      this.mxNode.setStyle(style);
      this.graph.refresh(this.mxNode);
    }
    this._color = newColor;
  }

  public constructor(data: number, protected readonly graph: Graph) {
    this.data = data;

    this.mxNode = graph.insertVertex(graph.getDefaultParent(), data + '', data, 10, 10, 40, 40, {
      fillColor: 'red',
      fontColor: 'white',
    });
  }

  public getData(): number {
    return this.data;
  }

  public printNode(): void {
    console.group('Key: %c' + this.data, `background: ${this.getColorString()}`);
    this.left?.printNode();
    this.right?.printNode();
    console.groupEnd();
  }

  public getColorString(): string {
    if (this.color === BLACK) {
      return 'black';
    }
    return 'red';
  }

  /**
   * Only call to remove from mxgraph, before the node is removed from the tree.
   * Otherwise mxgraph has no chance of knowing will no longer be used
   */
  public destroy(): void {
    if (!this.parent) {
      this.graph.removeCells([this.mxNode]);
    }
  }
}

export class NilNode extends Node {
  public constructor(graph: Graph) {
    super(0, graph);
    this.color = BLACK;
  }

  public override destroy(): void {
    this.graph.removeCells([this.mxNode]);
  }
}
