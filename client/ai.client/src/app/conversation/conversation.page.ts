import { Component, OnInit, signal, Signal, WritableSignal  } from '@angular/core';
import { ChatInputComponent } from './components/chat-input/chat-input.component';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';
import { IonHeader, IonToolbar, IonButtons, IonTitle, IonContent, IonFooter, IonMenuButton, IonButton, IonIcon, ModalController, IonAvatar, IonPopover, IonItem } from "@ionic/angular/standalone";
import { ConversationTextComponent } from './components/conversation-text/conversation-text.component';
import { Conversation, Message, Model } from './services/conversation.model';
import { ChatRequestService } from './services/chat-request.service';
import { ConversationService } from './services/conversation.service';
import { ModelService } from './services/model.service';
import { CurrencyPipe, JsonPipe } from '@angular/common';
import { ModelSettingsComponent } from './components/model-settings/model-settings.component';
import { ActivatedRoute } from '@angular/router';
import { MessageMapService } from './services/message-map.service';
import { AuthService } from '../auth/auth.service';
import { ReportingService } from '../reporting/reporting.service';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.page.html',
  styleUrls: ['./conversation.page.scss'],
  standalone: true,
  imports: [CurrencyPipe, IonItem, IonPopover, IonAvatar, IonIcon, IonButton, IonFooter, IonContent, IonTitle, IonButtons, IonToolbar, IonHeader, ChatInputComponent, IonMenuButton, ConversationTextComponent]
})
export class ConversationPage implements OnInit {
  currentUser: Signal<any> = this.authService.getCurrentUser();
  currentConversation: Signal<Conversation> = this.conversationService.getCurrentConversation();
  monthToDateUserCost = this.reportingService.monthToDateUserCostResource
  chatLoading: Signal<boolean> = this.chatRequestService.getChatLoading();
  selectedModel: Signal<Model> = this.modelService.getSelectedModel();
  messages: Signal<Message[]> = signal([]);
  isModalOpen = false;
  monthToDateCost = { cost: 0 };

  constructor(
    private authService: AuthService,
    private chatRequestService: ChatRequestService,
    private conversationService: ConversationService,
    private messageMapService: MessageMapService,
    private modalController: ModalController,
    private modelService: ModelService,
    private reportingService: ReportingService,
    private route: ActivatedRoute) {
    addIcons({chevronForwardOutline});
  }

  ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      const conversationId = params.get('conversationId');
      if (conversationId) {
        const conversation = await this.conversationService.loadConversationById(conversationId);
        this.conversationService.setCurrentConversation(conversation);
        this.messages = this.messageMapService.getMessagesForConversation(conversationId);
      } else {
        this.messages = signal([]);
        this.conversationService.setCurrentConversation({ conversationId: 'pending', name: 'New Chat'})
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
