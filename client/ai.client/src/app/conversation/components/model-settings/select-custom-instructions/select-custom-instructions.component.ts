import { Component, input, OnInit, Signal } from '@angular/core';
import { IonHeader, IonToolbar, IonContent, IonTitle, IonList, IonItem, IonLabel, IonButtons, IonButton, ModalController, IonItemDivider } from "@ionic/angular/standalone";
import { FilterInstructionsPipe } from "./filter.pipe";
import { CustomInstruction } from 'src/app/conversation/services/conversation.model';
import { CustomInstructionService } from 'src/app/conversation/services/custom-instruction.service';

@Component({
  selector: 'app-select-custom-instructions',
  templateUrl: './select-custom-instructions.component.html',
  styleUrls: ['./select-custom-instructions.component.scss'],
  standalone: true,
  imports: [IonItemDivider, IonButton, IonButtons, IonLabel, IonItem, IonList, IonTitle, IonContent, IonToolbar, IonHeader, FilterInstructionsPipe]
})
export class SelectCustomInstructionsComponent  implements OnInit {
  customInstructions: Signal<CustomInstruction[]> = this.customInstructionService.getCustomInstructions();

  constructor(
    private customInstructionService: CustomInstructionService,
    private modalController: ModalController) { }

  ngOnInit() {}

  setSelectedCustomInstruction(instruction: CustomInstruction) {
    this.customInstructionService.setSelectedCustomInstruction(instruction);
    this.modalController.dismiss();

  }

  dismiss() {
    this.modalController.dismiss();
  }

}
