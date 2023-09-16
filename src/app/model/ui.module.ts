import { NgModule } from '@angular/core';
import { GraphComponent } from '../ui/graph/graph.component';
import { DebuggerComponent } from '../ui/debugger/debugger.component';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { CdkTree, CdkTreeModule } from '@angular/cdk/tree';

@NgModule({
  imports: [MatTreeModule, MatIconModule, MatButtonModule, CommonModule, CdkTreeModule],
  declarations: [GraphComponent, DebuggerComponent],
  exports: [DebuggerComponent, GraphComponent],
})
export class UiModule {}
