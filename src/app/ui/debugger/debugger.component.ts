import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';

import { Steppable } from '../../model/instructions/steppable';
import { faCircle, faEject } from '@fortawesome/free-solid-svg-icons';
import { BreakpointService } from '../../breakpoint.service';
import { RuntimeService } from '../../runtime.service';

@Component({
  selector: 'rbv-debugger',
  templateUrl: './debugger.component.html',
  styleUrls: ['./debugger.component.scss'],
})
export class DebuggerComponent implements OnInit {
  public faEject = faEject;
  public faCircle = faCircle;

  treeControl = new NestedTreeControl<Steppable>((node) => node.getChildren());
  dataSource = new MatTreeNestedDataSource<Steppable>();
  public readonly halted$ = this.runtimeService.getRuntime().halted$;
  public readonly ignoreBreakpoints$ = this.breakpointService.areBreakpointsHidden$();

  hasChild = (_: number, node: Steppable) => node.getChildren().length > 0;
  public constructor(
    private readonly runtimeService: RuntimeService,
    private readonly breakpointService: BreakpointService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    setInterval(() => {
      changeDetectorRef.detectChanges();
    }, 1000);
  }

  public ngOnInit() {
    this.runtimeService.getRuntime().methods$.subscribe((methods) => {
      this.dataSource.data = [...methods.values()];
    });
  }

  public resume(): void {
    this.runtimeService.getRuntime().resume();
  }

  public stepOver(): void {
    this.runtimeService.getRuntime().stepOver();
  }

  toggleBreakpoints(): void {
    this.breakpointService.toggleBreakpointsHidden();
  }
}
