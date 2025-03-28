import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController, IonHeader, IonToolbar, IonContent, IonButton, IonItem, IonInput, IonCheckbox, IonTextarea, IonFooter, IonGrid, IonRow, IonCol, IonLabel, IonButtons, IonCard } from "@ionic/angular/standalone";
import { ModelService } from 'src/app/conversation/services/model.service';
import { validateAllFormFields } from 'src/app/shared/form-utils';

@Component({
  selector: 'app-save-model-modal',
  templateUrl: './save-model-modal.component.html',
  styleUrls: ['./save-model-modal.component.scss'],
  standalone: true,
  imports: [IonCard, IonButtons, IonCol, IonRow, IonGrid, IonFooter, IonTextarea, IonCheckbox, IonInput, IonItem, IonButton, IonContent, IonToolbar, IonHeader, ReactiveFormsModule, IonLabel ]
})
export class SaveModelModalComponent  implements OnInit {
  form: FormGroup = this.fb.group({
    modelId: ['', Validators.required],
    enabled: [true, Validators.required],
    isDefault: [true, Validators.required],
    description: [''],
    creator: [''],
    outputPricePerMillionTokens: [0, [Validators.required, Validators.min(0.00001)]],
    name: ['', Validators.required],
    inputPricePerMillionTokens: [0, [Validators.required, Validators.min(0.00001)]],
    sortOrder: [1, Validators.required],
    effectiveDate: ['', Validators.required],
    allowedRoles: this.fb.array([]),
  });

  // Add the available roles
  availableRoles = [
    { name: 'Students', value: 'Students' },
    { name: 'Faculty', value: 'Faculty' },
    { name: 'Staff', value: 'Staff' },
    { name: 'Developers', value: 'DotNetDevelopers' }
  ];

  constructor(private fb: FormBuilder, private modelService: ModelService, private modalController: ModalController) { }

  ngOnInit() {

  }

  // Add a method to toggle role selection
  toggleRole(role: string) {
    const rolesArray = this.form.get('allowedRoles') as FormArray;
    const index = rolesArray.value.indexOf(role);
    
    if (index >= 0) {
      // Remove role if already in array
      rolesArray.removeAt(index);
    } else {
      // Add role if not in array
      rolesArray.push(this.fb.control(role));
    }
  }

  // Add a method to check if a role is selected
  isRoleSelected(role: string): boolean {
    const rolesArray = this.form.get('allowedRoles') as FormArray;
    return rolesArray.value.includes(role);
  }

  dismiss() {
    this.modalController.dismiss();
  }

  saveModel() {
    this.form.value
    if(this.form.valid) {
      this.modelService.addModel(this.form.value)
    } else {
      validateAllFormFields(this.form)
    }
  }

}
