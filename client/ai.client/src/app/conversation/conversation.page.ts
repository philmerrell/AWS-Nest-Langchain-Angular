import { Component, effect, OnInit, signal, Signal } from '@angular/core';
import { ChatInputComponent } from './components/chat-input/chat-input.component';
import { addIcons } from 'ionicons';
import { ellipsisHorizontal } from 'ionicons/icons';
import { IonHeader, IonToolbar, IonButtons, IonTitle, IonContent, IonFooter, IonMenuButton, IonButton, IonIcon, ModalController, IonAvatar, IonPopover, IonItem, PopoverController, IonBackButton } from "@ionic/angular/standalone";
import { ConversationTextComponent } from './components/conversation-text/conversation-text.component';
import { Conversation, Message, Model } from './services/conversation.model';
import { ChatRequestService } from './services/chat-request.service';
import { ConversationService } from './services/conversation.service';
import { ActivatedRoute } from '@angular/router';
import { MessageMapService } from './services/message-map.service';
import { AuthService } from '../auth/auth.service';
import { UserMenuComponent } from '../core/user-menu/user-menu.component';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.page.html',
  styleUrls: ['./conversation.page.scss'],
  standalone: true,
  imports: [IonBackButton,  IonAvatar, IonButton, IonFooter, IonContent, IonTitle, IonButtons, IonToolbar, IonHeader, ChatInputComponent, IonMenuButton, ConversationTextComponent]
})
export class ConversationPage implements OnInit {
  currentUser: Signal<any> = this.authService.getCurrentUser();
  currentConversation: Signal<Conversation> = this.conversationService.getCurrentConversation();
  chatLoading: Signal<boolean> = this.chatRequestService.getChatLoading();
  messages: Signal<Message[]> = signal([]);
  isModalOpen = false;
  monthToDateCost = { cost: 0 };

  constructor(
    private authService: AuthService,
    private chatRequestService: ChatRequestService,
    private conversationService: ConversationService,
    private messageMapService: MessageMapService,
    private popoverController: PopoverController,
    private route: ActivatedRoute) {
      addIcons({ellipsisHorizontal});

      effect(() => {
        const conversation = this.conversationService.getCurrentConversation()
        this.messages = this.messageMapService.getMessagesForConversation(conversation().conversationId);
      }) 
  }

  ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      const conversationId = params.get('conversationId');
      if (conversationId) {
        const conversation = await this.conversationService.loadConversationById(conversationId);
        this.conversationService.setCurrentConversation(conversation);
        
      } else {
        this.conversationService.setCurrentConversation({ conversationId: 'pending', name: 'New Chat'})
      }
    });
  }

  async presentPopover(e: Event) {
    const popover = await this.popoverController.create({
      component: UserMenuComponent,
      event: e,
    });

    await popover.present();

    const { role } = await popover.onDidDismiss();
    console.log(`Popover dismissed with role: ${role}`);
  }

}
