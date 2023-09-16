import { Component, Input } from '@angular/core';
import { Steppable } from '../../../model/instructions/steppable';
import { Observable, of } from 'rxjs';
import { Method } from '../../../model/instructions/method';
import { ActiveProgramService } from '../../../model/active-program.service';
import { map, switchMap } from 'rxjs/operators';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';
import { ArgDialogComponent, ArgDialogData } from '../../arg-dialog/arg-dialog.component';
import { RetDialogData, ReturnDialogComponent } from '../../return-dialog/return-dialog.component';
import { RuntimeService } from '../../../runtime.service';

@Component({
  selector: 'av-run-method',
  templateUrl: 'run-method.component.html',
  styleUrls: ['run-method.component.scss'],
})
export class RunMethodComponent {
  protected readonly faPlay = faPlay;

  @Input()
  public instruction: Steppable;

  public readonly ready$ = this.runtimeService.getRuntime().active$.pipe(map((a) => !a));

  public constructor(private readonly runtimeService: RuntimeService, private readonly dialog: MatDialog) {}

  public runMethod(method: Steppable): void {
    // TODO add arguments
    if (!(method instanceof Method)) {
      return;
    }

    const argList = method.getArgumentNames();

    (argList.length > 0
      ? this.dialog
          .open(ArgDialogComponent, {
            data: <ArgDialogData>{
              argumentNames: method.getArgumentNames(),
            },
          })
          .afterClosed()
      : of(new Map())
    )
      .pipe(
        switchMap((val: Map<string, string | number>) => {
          console.log(val);
          if (!val) {
            return of();
          }

          return this.runtimeService.getRuntime().callMethod(method.getName(), val);
        })
      )
      .subscribe((returnedVal) => {
        console.log(returnedVal);
        if (returnedVal !== undefined) {
          this.dialog.open(ReturnDialogComponent, {
            data: <RetDialogData>{
              value: returnedVal,
            },
          });
        }
      });
  }
}
