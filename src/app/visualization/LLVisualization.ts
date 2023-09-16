import { VisualizationStrategy } from './visualization-strategy';
import { Graph } from '@maxgraph/core';
import { Container } from '../model/container';
import { LLContainer } from '../model/programs/steppable-linked-list';

export class LLVisualization extends VisualizationStrategy {
  private static readonly X_OFFSET = 10;
  private static readonly Y_OFFSET = 10;

  public override visualize(graph: Graph, root: Container<any>) {
    this.clear(graph);
    if (!(root instanceof LLContainer)) {
      return;
    }

    const list: LLContainer<any>[] = [];
    let el = root;

    while (el) {
      list.push(el);
      el = el.getSuccessor();
    }

    graph.batchUpdate(() => {
      const vertices = list.map((el, i) => {
        const x = i * 100 + LLVisualization.X_OFFSET;
        const y = LLVisualization.Y_OFFSET;
        return graph.insertVertex(
          graph.getDefaultParent(),
          null,
          el.getElement(),
          x,
          y,

          40,
          40
        );
      });
      list.forEach((el, idx) => {
        if (el.getSuccessor()) {
          const cellForContainer = vertices[idx];
          const cellForNextContainer = vertices[idx + 1];
          if (cellForContainer && cellForNextContainer) {
            graph.insertEdge(graph.getDefaultParent(), null, '', cellForContainer, cellForNextContainer);
          }
        }
      });
    });
  }
}
