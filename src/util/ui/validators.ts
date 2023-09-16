import { FormGroup } from '@angular/forms';
import { TypeOfType } from '../types/typeof';
import { toNumberIfPossible } from '../number';

// custom validator to check that two fields match
export function MustMatch(controlName: string, matchingControlName: string) {
  return (formGroup: FormGroup) => {
    const control = formGroup.controls[controlName];
    const matchingControl = formGroup.controls[matchingControlName];

    if (matchingControl.errors && !matchingControl.errors.mustMatch) {
      // return if another validator has already found an error on the matchingControl
      return;
    }

    // set error on matchingControl if validation fails
    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ mustMatch: true });
    } else {
      matchingControl.setErrors(null);
    }
  };
}

export function IsOfType(controlName: string, type: TypeOfType) {
  return (formGroup: FormGroup) => {
    const control = formGroup.controls[controlName];

    if (type === 'string') {
      control.setErrors(null);
    }
    const asNumber = toNumberIfPossible(control.value);
    // set error on matchingControl if validation fails
    if (typeof asNumber !== type) {
      control.setErrors({ wrongType: true });
    } else {
      control.setErrors(null);
    }
  };
}
