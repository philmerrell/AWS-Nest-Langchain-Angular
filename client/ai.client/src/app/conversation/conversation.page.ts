import { Component, effect, OnInit, signal, Signal } from '@angular/core';
import { ChatInputComponent } from './components/chat-input/chat-input.component';
import { addIcons } from 'ionicons';
import { ellipsisHorizontal } from 'ionicons/icons';
import { IonHeader, IonToolbar, IonButtons, IonTitle, IonContent, IonFooter, IonMenuButton, IonButton, IonAvatar, PopoverController, IonIcon } from "@ionic/angular/standalone";
import { ConversationTextComponent } from './components/conversation-text/conversation-text.component';
import { Conversation, Message } from './services/conversation.model';
import { ChatRequestService } from './services/chat-request.service';
import { ConversationService } from './services/conversation.service';
import { ActivatedRoute } from '@angular/router';
import { MessageMapService } from './services/message-map.service';
import { AuthService } from '../auth/auth.service';
import { UserMenuComponent } from '../core/user-menu/user-menu.component';
import { ConversationActionsComponent } from '../core/conversation-actions/conversation-actions.component';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.page.html',
  styleUrls: ['./conversation.page.scss'],
  standalone: true,
  imports: [IonIcon, IonAvatar, IonButton, IonFooter, IonContent, IonTitle, IonButtons, IonToolbar, IonHeader, ChatInputComponent, IonMenuButton, ConversationTextComponent]
})
export class ConversationPage implements OnInit {
  currentUser: Signal<any> = this.authService.getCurrentUser();
  currentConversation: Signal<Conversation> = this.conversationService.getCurrentConversation();
  chatLoading: Signal<boolean> = this.chatRequestService.getChatLoading();
  messages: Signal<Message[]> = signal([]);
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

  async presentUserMenuPopover(e: Event) {
    const popover = await this.popoverController.create({
      component: UserMenuComponent,
      event: e,
    });

    await popover.present();

    const { role } = await popover.onDidDismiss();
    console.log(`Popover dismissed with role: ${role}`);
  }

  async presentConverstaionActionPopover(event: Event, conversation: Conversation) {
      event.stopPropagation(); // Prevent the conversation from being selected
      
      const popover = await this.popoverController.create({
        component: ConversationActionsComponent,
        event,
        componentProps: {
          conversation
        },
        translucent: true
      });
      
      await popover.present();
    }

}
