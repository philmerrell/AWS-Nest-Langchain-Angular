import { Component, OnInit, Signal } from '@angular/core';
import { addIcons } from 'ionicons';
import { IonIcon, IonTextarea, IonButton, IonGrid, IonRow, IonCol, ModalController } from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
import { arrowUpOutline, stop, close } from 'ionicons/icons';
import { ChatRequestService } from '../../services/chat-request.service';
import { Model } from '../../services/conversation.model';
import { ModelService } from '../../services/model.service';
import { ModelSettingsComponent } from '../model-settings/model-settings.component';

@Component({
  selector: 'app-chat-input',
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.scss'],
  standalone: true,
  imports: [IonCol, IonRow, IonGrid, IonButton, IonTextarea, IonButton, IonTextarea, FormsModule, IonIcon]
})
export class ChatInputComponent  implements OnInit {
  chatLoading: Signal<boolean> = this.chatRequestService.getChatLoading();
  selectedModel: Signal<Model | null> = this.modelService.getSelectedModel();
  message: string = '';
  loading: boolean = false;
  error = '';
  
  constructor(private chatRequestService: ChatRequestService, private modalController: ModalController, private modelService: ModelService) {
    addIcons({close, stop, arrowUpOutline});
  }

  ngOnInit() {}


  handleSubmitChat() {
    if (this.chatLoading()) {
      this.cancelChatRequest()
    } else {
      this.submitChatRequest()
    }
  }

  handleEnterKey(event: any) {
    if (event.which === 13 && !event.shiftKey) {
      event.preventDefault();
      if (!this.chatLoading()) {
        this.submitChatRequest();
      }
    }
  }

  async openModelSettingsModal() {
    const modal = await this.modalController.create({
      component: ModelSettingsComponent,
    });
    modal.present();
  }


  private submitChatRequest() {
    const message = this.message.trim();
    if (message !== '') {
      this.chatRequestService.submitChatRequest(this.message);
    }
    this.message = ''
  }

  private cancelChatRequest() {
    this.chatRequestService.cancelChatRequest();
  }

}
