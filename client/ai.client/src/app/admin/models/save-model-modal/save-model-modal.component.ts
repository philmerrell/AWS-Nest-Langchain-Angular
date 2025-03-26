import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonHeader, IonToolbar, IonContent, IonButton, IonItem, IonInput, IonCheckbox, IonTextarea, IonFooter, IonGrid, IonRow, IonCol } from "@ionic/angular/standalone";
import { ModelService } from 'src/app/conversation/services/model.service';

@Component({
  selector: 'app-save-model-modal',
  templateUrl: './save-model-modal.component.html',
  styleUrls: ['./save-model-modal.component.scss'],
  standalone: true,
  imports: [IonCol, IonRow, IonGrid, IonFooter, IonTextarea, IonCheckbox, IonInput, IonItem, IonButton, IonContent, IonToolbar, IonHeader, ReactiveFormsModule ]
})
export class SaveModelModalComponent  implements OnInit {
  form: FormGroup =  this.fb.group({
    modelId: ['', Validators.required],
    enabled: [true, Validators.required],
    description: ['', Validators.required],
    outputPricePerMillionTokens: [0, Validators.required],
    name: ['', Validators.required],
    inputPricePerMillionTokens: [0, Validators.required],
    sortOrder: [1, Validators.required],
  });

  constructor(private fb: FormBuilder, private modelService: ModelService) { }

  ngOnInit() {

  }

  saveModel() {
    if(this.form.valid) {

      this.modelService.addModel(this.form.value)
    }
  }

}
