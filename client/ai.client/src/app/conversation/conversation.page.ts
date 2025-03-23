import { Component, OnInit, signal, Signal, WritableSignal  } from '@angular/core';
import { ChatInputComponent } from './components/chat-input/chat-input.component';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';
import { IonHeader, IonToolbar, IonButtons, IonTitle, IonContent, IonFooter, IonMenuButton, IonButton, IonIcon, ModalController } from "@ionic/angular/standalone";
import { ConversationTextComponent } from './components/conversation-text/conversation-text.component';
import { Conversation, Message, Model } from './services/conversation.model';
import { ChatRequestService } from './services/chat-request.service';
import { ConversationService } from './services/conversation.service';
import { ModelService } from './services/model.service';
import { JsonPipe } from '@angular/common';
import { ModelSettingsComponent } from './components/model-settings/model-settings.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.page.html',
  styleUrls: ['./conversation.page.scss'],
  standalone: true,
  imports: [IonIcon, IonButton, IonFooter, IonContent, IonTitle, IonButtons, IonToolbar, IonHeader, ChatInputComponent, IonMenuButton, ConversationTextComponent, JsonPipe ]
})
export class ConversationPage implements OnInit {
  currentConversation: Signal<Conversation> = this.conversationService.getCurrentConversation();
  chatLoading: Signal<boolean> = this.chatRequestService.getChatLoading();
  selectedModel: Signal<Model> = this.modelService.getSelectedModel();
  messages: WritableSignal<Message[]> = signal([]);
  isModalOpen = false;

  constructor(
    private chatRequestService: ChatRequestService,
    private conversationService: ConversationService,
    private modalController: ModalController,
    private modelService: ModelService,
    private route: ActivatedRoute) {
    addIcons({chevronForwardOutline});
  }

  ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      const conversationId = params.get('conversationId');
      console.log('hey')
      if (conversationId) {
        this.conversationService.setCurrentConversationId(conversationId);
        const currentConversation = this.conversationService.getCurrentConversation();
        const messages = await this.conversationService.getMessages(conversationId);
        this.messages.set(messages);
      }
    });
  }



  async openModelSettingsModal() {
    const modal = await this.modalController.create({
      component: ModelSettingsComponent,
    });
    modal.present();
  }




}
