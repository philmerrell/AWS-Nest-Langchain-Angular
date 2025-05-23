import { Component, OnInit, ResourceRef, ResourceStatus } from '@angular/core';
import { ConversationService } from 'src/app/conversation/services/conversation.service';
import { 
  IonItem, IonLabel, IonSpinner, IonList, IonItemDivider, 
  IonIcon, IonText, IonButtons, IonButton, PopoverController, IonCard } from "@ionic/angular/standalone";
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { chatboxOutline, createOutline, ellipsisHorizontal } from 'ionicons/icons';
import { ConversationActionsComponent } from '../conversation-actions/conversation-actions.component';
import { Conversation } from 'src/app/conversation/services/conversation.model';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  imports: [IonCard, IonList, 
    IonItemDivider, IonSpinner, IonLabel, IonItem, 
    IonIcon, IonText, IonButton
  ],
  standalone: true
})
export class SideNavComponent implements OnInit {
  status = ResourceStatus;
  conversations!: ResourceRef<Conversation[] | undefined>;
  currentConversation = this.conversationService.getCurrentConversation();

  constructor(
    private conversationService: ConversationService, 
    private router: Router,
    private popoverController: PopoverController
  ) {
    addIcons({chatboxOutline, createOutline, ellipsisHorizontal});
      this.conversations = this.conversationService.conversationsResource
  
  }

  ngOnInit() {}

  getStarredConversations(): Conversation[] {
    const allConversations = this.conversations.value() || [];
    return allConversations.filter(conversation => 
      conversation.isStarred && conversation.conversationId !== 'pending'
    );
  }
  
  // Helper method to get non-starred conversations
  getNonStarredConversations(): Conversation[] {
    const allConversations = this.conversations.value() || [];
    return allConversations.filter(conversation => 
      !conversation.isStarred
    );
  }

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