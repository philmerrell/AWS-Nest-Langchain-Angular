import { FormGroup } from '@angular/forms';

export function validateAllFormFields(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
        const control = formGroup.get(field);
        if (control instanceof FormGroup) {
            validateAllFormFields(control);
        } else {
            control?.markAsTouched({ onlySelf: true });
            control?.updateValueAndValidity({ onlySelf: true });
        }
    });
}