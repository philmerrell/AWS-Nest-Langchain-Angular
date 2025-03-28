// client/ai.client/src/app/core/side-nav/side-nav.component.ts
import { Component, OnInit, ResourceStatus } from '@angular/core';
import { ConversationService } from 'src/app/conversation/services/conversation.service';
import { 
  IonItem, IonLabel, IonSpinner, IonList, IonItemDivider, 
  IonIcon, IonText, IonButtons, IonButton, PopoverController 
} from "@ionic/angular/standalone";
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { chatboxOutline, createOutline, ellipsisHorizontal } from 'ionicons/icons';
import { ConversationActionsComponent } from '../conversation-actions/conversation-actions.component';
import { Conversation } from 'src/app/conversation/services/conversation.model';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  imports: [
    IonItemDivider, IonList, IonSpinner, IonLabel, IonItem, 
    IonIcon, IonText, IonButtons, IonButton,
  ],
  standalone: true
})
export class SideNavComponent implements OnInit {
  status = ResourceStatus;
  conversations = this.conversationService.conversationsResource;
  currentConversation = this.conversationService.getCurrentConversation();

  constructor(
    private conversationService: ConversationService, 
    private router: Router,
    private popoverController: PopoverController
  ) {
    addIcons({chatboxOutline, createOutline, ellipsisHorizontal});
  }

  ngOnInit() {}

  newChat() {
    this.conversationService.createNewConversation();
  }

  setConversation(conversation: any) {
    if(conversation.conversationId === 'pending') {
      this.newChat();
    } else {
      this.router.navigate(['c', conversation.conversationId])
      this.conversationService.setCurrentConversation(conversation);
    }
  }

  async presentActionPopover(event: Event, conversation: Conversation) {
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