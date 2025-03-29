import { Component, OnInit, Signal } from '@angular/core';
import { IonItem, IonSelect, IonSelectOption, IonLabel, IonRange, ModalController, IonGrid, IonRow, IonCol, IonItemDivider, IonToolbar, IonTitle, IonHeader, IonContent, IonBackButton, IonButtons, IonButton, IonFooter } from '@ionic/angular/standalone';
import { SelectCustomInstructionsComponent } from '../select-custom-instructions/select-custom-instructions.component';
import { CustomInstruction, Model } from 'src/app/conversation/services/conversation.model';
import { CustomInstructionService } from 'src/app/conversation/services/custom-instruction.service';
import { ModelService } from 'src/app/conversation/services/model.service';

@Component({
  selector: 'app-advanced-settings',
  templateUrl: './advanced-settings.component.html',
  styleUrls: ['./advanced-settings.component.scss'],
  standalone: true,
  imports: [IonFooter, IonButton, IonButtons, IonBackButton, IonContent, IonHeader, IonTitle, IonToolbar, IonCol, IonRow, IonGrid, IonItem, IonSelect, IonSelectOption, IonLabel, IonRange]
})
export class AdvancedSettingsComponent  implements OnInit {
  modelPopoverOptions = {
    header: 'Models',
    subHeader: 'Select a model',
  };
  customInstructionsPopoverOptions = {
    header: 'Custom Instructions',
    subHeader: 'Select instructions',
  };
  models: Model[] = [];
  selectedModel: Signal<Model | null> = this.modelService.getSelectedModel();
  selectedTemperature: Signal<number> = this.modelService.getSelectedTemperature();
  selectedCustomInstructions: Signal<CustomInstruction> = this.customInstructionService.getSelectedCustomInstruction();

  constructor(
    private customInstructionService: CustomInstructionService,
    private modalController: ModalController,
    private modelService: ModelService) { }

  ngOnInit() {
    this.getModels();
  }

  dismiss() {
    this.modalController.dismiss();
  }

  async presentCustomInstructionsModal() {
    const modal = await this.modalController.create({
      component: SelectCustomInstructionsComponent
    });
    modal.present();
  }

  getModels() {
    // this.models = this.modelService.getModels();
  }

  handleModelChange(event: any) {
    const model = event.detail.value;
    this.modelService.setSelectedModel(model);
  }

  handleTempChange(event: any) {
    const temperature = event.detail.value;
    this.modelService.setSelectedTemperature(temperature);
  }

  temperatureFormatter(value: number) {
    return value;
  }

}
