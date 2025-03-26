import { Component, Input, OnInit, ResourceStatus, Signal } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, ModalController, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonNav, IonNavLink, IonItemDivider, IonSkeletonText, IonText } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { checkmarkCircle, settingsOutline } from 'ionicons/icons';
import { AdvancedSettingsComponent } from '../model-settings/advanced-settings/advanced-settings.component';
import { Model } from '../../services/conversation.model';
import { ModelService } from '../../services/model.service';

@Component({
  selector: 'app-select-model',
  templateUrl: './select-model.component.html',
  styleUrls: ['./select-model.component.scss'],
  standalone: true,
  imports: [IonText, IonSkeletonText, IonItemDivider, IonIcon, IonButton, IonButtons, IonLabel, IonItem, IonList, IonContent, IonTitle, IonToolbar, IonHeader, ]
})
export class SelectModelComponent  implements OnInit {
  @Input() nav!: IonNav;
  status = ResourceStatus;
  models = this.modelService.models;
  selectedModel: Signal<Model> = this.modelService.getSelectedModel();

  constructor(
    private modalController: ModalController,
    private modelService: ModelService) {
    addIcons({settingsOutline,checkmarkCircle });
  }

  ngOnInit() {
  }

  dismiss() {
    this.modalController.dismiss();
  }

  navigateToAdvancedSettings() {
    this.nav.push(AdvancedSettingsComponent);
  }

  selectModel(model: Model) {
    this.modelService.setSelectedModel(model);
    this.dismiss();
  }

}
