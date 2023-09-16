import { Graph } from '@maxgraph/core';
import { Container } from '../model/container';

export class VisualizationStrategy {
  public visualize(graph: Graph, root: Container<any>): void {}

  protected clear(graph: Graph): void {
    graph.batchUpdate(() => {
      graph.removeCells(graph.getDefaultParent().getChildCells());
    });
  }
}
