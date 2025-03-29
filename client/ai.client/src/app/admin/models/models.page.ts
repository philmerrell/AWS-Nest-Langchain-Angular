import { Component, OnInit, ResourceStatus } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, ModalController, IonButtons, IonBackButton, IonCard, IonList, IonItem, IonButton, IonLabel, IonText, IonGrid, IonRow, IonCol, IonSpinner, IonSkeletonText, IonIcon, IonListHeader, IonBadge, ToastController } from '@ionic/angular/standalone';
import { SaveModelModalComponent } from './save-model-modal/save-model-modal.component';
import { ModelService } from 'src/app/conversation/services/model.service';
import { Model } from '../../conversation/services/conversation.model';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';

@Component({
  selector: 'app-models',
  templateUrl: './models.page.html',
  styleUrls: ['./models.page.scss'],
  standalone: true,
  imports: [IonListHeader, IonIcon, IonList, IonSkeletonText, IonLabel, IonText, IonItem, IonCard, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonBadge, IonButton]
})
export class ModelsPage implements OnInit {
  status = ResourceStatus;
  models = this.modelService.models;
  
  constructor(
    private modalController: ModalController, 
    private modelService: ModelService,
    private toastController: ToastController
  ) {
    addIcons({add})
  }

  async ngOnInit() {
    
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

  async setDefaultModel(model: Model) {
    try {
      await this.modelService.setDefaultModel(model.modelId);
      // Refresh the models list
      this.models.reload();
      
      const toast = await this.toastController.create({
        message: `${model.name} has been set as the default model.`,
        duration: 2000,
        color: 'success'
      });
      toast.present();
    } catch (error) {
      console.error('Error setting default model:', error);
      const toast = await this.toastController.create({
        message: 'Failed to set default model. Please try again.',
        duration: 2000,
        color: 'danger'
      });
      toast.present();
    }
  }

  async presentModelModal() {
    
  }
}