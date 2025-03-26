import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController, IonHeader, IonToolbar, IonContent, IonButton, IonItem, IonInput, IonCheckbox, IonTextarea, IonFooter, IonGrid, IonRow, IonCol, IonLabel, IonButtons } from "@ionic/angular/standalone";
import { ModelService } from 'src/app/conversation/services/model.service';
import { validateAllFormFields } from 'src/app/shared/form-utils';

@Component({
  selector: 'app-save-model-modal',
  templateUrl: './save-model-modal.component.html',
  styleUrls: ['./save-model-modal.component.scss'],
  standalone: true,
  imports: [IonButtons, IonCol, IonRow, IonGrid, IonFooter, IonTextarea, IonCheckbox, IonInput, IonItem, IonButton, IonContent, IonToolbar, IonHeader, ReactiveFormsModule ]
})
export class SaveModelModalComponent  implements OnInit {
  form: FormGroup =  this.fb.group({
    modelId: ['', Validators.required],
    enabled: [true, Validators.required],
    isDefault: [true, Validators.required],
    description: [''],
    creator: [''],
    outputPricePerMillionTokens: [0, [Validators.required, Validators.min(0.00001)]],
    name: ['', Validators.required],
    inputPricePerMillionTokens: [0, [Validators.required, Validators.min(0.00001)]],
    sortOrder: [1, Validators.required],
    effectiveDate: ['', Validators.required]
  });

  constructor(private fb: FormBuilder, private modelService: ModelService, private modalController: ModalController) { }

  ngOnInit() {

  }

  dismiss() {
    this.modalController.dismiss();
  }

  saveModel() {
    this.form.value
    if(this.form.valid) {
      console.log(this.form.value)
      // this.modelService.addModel(this.form.value)
    } else {
      validateAllFormFields(this.form)
    }
  }

}
