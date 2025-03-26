import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, ModalController, IonButtons, IonBackButton, IonCard, IonList, IonItem, IonButton, IonLabel, IonText, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { SaveModelModalComponent } from './save-model-modal/save-model-modal.component';
import { ModelService } from 'src/app/conversation/services/model.service';
import { Model } from '../../conversation/services/conversation.model';

@Component({
  selector: 'app-models',
  templateUrl: './models.page.html',
  styleUrls: ['./models.page.scss'],
  standalone: true,
  imports: [IonCol, IonRow, IonGrid, IonText, IonLabel, IonButton, IonItem, IonList, IonCard, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ModelsPage implements OnInit {
  models: Model[] = [];
  constructor(private modalController: ModalController, private modelService: ModelService) { }

  async ngOnInit() {
    this.models = await this.modelService.loadModels();
  }

  async presentEditModelModal(model?: Model) {
    const modal = await this.modalController.create({
      component: SaveModelModalComponent,
      componentProps: {
        model
      }
    });
    modal.present();
  }

  dismiss() {
    this.modalController.dismiss();
  }

  async presentModelModal() {
    
  }

}
