import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { toNumberIfPossible } from '../../../util/number';
import { TypeOfType } from '../../../util/types/typeof';
import { IsOfType } from '../../../util/ui/validators';

export interface ArgDialogData {
  argumentNames: string[];
  argumentTypes?: TypeOfType[];
}
@Component({
  selector: 'av-arg-dialog',
  template: `
    <h3>Please enter the required arguments for this method to run:</h3>

    <mat-dialog-content>
      <form class="example-form" [formGroup]="argumentsFormGroup">
        <mat-form-field
          *ngFor="let argName of data.argumentNames"
          class="example-full-width"
          appearance="fill"
          [formGroup]="argumentsFormGroup">
          <mat-label>{{ argName }}</mat-label>
          <input matInput placeholder="" [formControlName]="argName" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="close(true)" [disabled]="argumentsFormGroup.invalid">OK</button>
      <button mat-button (click)="close(false)">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .example-form {
        min-width: 150px;
        max-width: 500px;
        width: 100%;
      }

      .example-full-width {
        width: 100%;
      }
    `,
  ],
})
export class ArgDialogComponent {
  public argumentsFormGroup: FormGroup;

  public constructor(
    @Inject(MAT_DIALOG_DATA) public data: ArgDialogData,
    private readonly ref: MatDialogRef<Map<string, string>>,
    private readonly formBuilder: FormBuilder
  ) {
    const config = {};
    data.argumentNames.forEach((name, idx) => {
      config[name] = [''];
    });
    this.argumentsFormGroup = formBuilder.group(config, {
      validators: [IsOfType('key', 'number')],
    });
  }

  public close(success: boolean): void {
    if (success) {
      const map = new Map<string, string | number>();
      this.data.argumentNames.forEach((name) => {
        map.set(name, toNumberIfPossible(this.argumentsFormGroup.get(name).value));
      });
      this.ref.close(map);
    } else {
      this.ref.close(null);
    }
  }
}
