import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface RetDialogData {
  value: unknown;
}
@Component({
  selector: 'av-return-dialog',
  template: `
    <h3>The method returned following values:</h3>

    <mat-dialog-content> {{ data.value | json }} </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="close()">OK</button>
    </mat-dialog-actions>
  `,
  styles: [``],
})
export class ReturnDialogComponent {
  public argumentsFormGroup: FormGroup;

  public constructor(@Inject(MAT_DIALOG_DATA) public data: RetDialogData, private readonly ref: MatDialogRef<void>) {}

  public close(): void {
    this.ref.close();
  }
}
