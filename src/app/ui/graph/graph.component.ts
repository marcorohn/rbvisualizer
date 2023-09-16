import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CellStyle, Graph, InternalEvent, Rectangle } from '@maxgraph/core';
import { createSteppableRBTree } from '../../model/programs/steppable-rb-tree';
import { faFileExport, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { downloadAsJson } from '../../../util/download';
import { isTreeExport, TreeExport } from '../../dto/tree-export';
import { RuntimeService } from '../../runtime.service';

@Component({
  selector: 'rbv-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss'],
})
export class GraphComponent implements OnInit {
  public readonly faFileExport = faFileExport;
  public readonly faFileImport = faFileImport;

  @ViewChild('editorDiv', { static: true })
  private editorDiv: ElementRef<HTMLDivElement>;

  private graph: Graph;

  public constructor(private readonly runtimeService: RuntimeService) {}

  public ngOnInit() {
    this.initGraph();
  }

  private initGraph(): void {
    const container = this.editorDiv.nativeElement;
    InternalEvent.disableContextMenu(container);

    this.graph = new Graph(container);
    this.graph.setPanning(true);

    const tree = createSteppableRBTree(this.graph);
    this.runtimeService.getRuntime().setProgram(tree);
    this.runtimeService.getRuntime().start();
  }

  public importTree($event): void {
    if ($event.target.files && $event.target.files[0]) {
      const file: File = $event.target.files[0];
      file.text().then((text) => {
        let exportDto;
        try {
          exportDto = JSON.parse(text) as TreeExport;
        } catch (e) {
          alert('could not parse provided json!');
        }

        if (isTreeExport(exportDto)) {
          this.runtimeService.getRuntime().applySnapshot(exportDto);
        } else {
          alert('The provided file is not an export of a red-black-tree made with this application!');
        }
      });
    }
  }

  public exportTree(): void {
    const exportDto = this.runtimeService.getRuntime().createSnapshot();
    downloadAsJson(exportDto, 'red-black-tree.json');
  }
}
