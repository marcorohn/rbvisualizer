import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppComponent } from './layout/app.component';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTableModule } from '@angular/material/table';
import { FunctionExpressionModule } from 'ngx-function-expression';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatSortModule } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { LayoutModule } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTreeModule } from '@angular/material/tree';
import { GraphComponent } from './graph/graph.component';
import { DebuggerComponent } from './debugger/debugger.component';
import { RunMethodComponent } from './debugger/nested-instruction/run-method.component';
import { ArgDialogComponent } from './arg-dialog/arg-dialog.component';
import { ReturnDialogComponent } from './return-dialog/return-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    GraphComponent,
    DebuggerComponent,
    RunMethodComponent,
    ArgDialogComponent,
    ReturnDialogComponent,
  ],
  exports: [],
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatFormFieldModule,
    MatDialogModule,
    MatToolbarModule,
    MatTableModule,
    FunctionExpressionModule,
    MatPaginatorModule,
    MatTabsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
    MatInputModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatSortModule,
    MatDatepickerModule,
    MatCheckboxModule,
    FormsModule,
    ScrollingModule,
    MatIconModule,
    MatAutocompleteModule,
    LayoutModule,
    MatSidenavModule,
    MatListModule,
    MatGridListModule,
    MatMenuModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatTreeModule,
  ],
  providers: [],
})
export class UiModule {
  constructor() {}
}
