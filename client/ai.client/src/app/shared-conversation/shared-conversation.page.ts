import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonBackButton, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonLabel, IonFooter, IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { ConversationSharingService, SharedConversation, SharedMessage } from '../conversation/services/conversation-sharing.service';
import { DatePipe } from '@angular/common';
import { ConversationTextComponent } from '../conversation/components/conversation-text/conversation-text.component';
import { addIcons } from 'ionicons';
import { addCircleOutline } from 'ionicons/icons';
import { ConversationService } from '../conversation/services/conversation.service';
import { Message } from '../conversation/services/conversation.model';

@Component({
  selector: 'app-shared-conversation',
  templateUrl: './shared-conversation.page.html',
  styleUrls: ['./shared-conversation.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonIcon, IonButton, IonFooter, IonLabel, IonItem, 
    ConversationTextComponent, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
    IonBackButton, IonCard, IonCardHeader, IonCardTitle, 
    IonCardContent, DatePipe
  ],
})
export class SharedConversationPage implements OnInit {
  sharedConversationId = '';
  conversation: SharedConversation | null = null;
  messages: Message[] = [];
  isLoading = true;
  isAddingConversation = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private conversationService: ConversationService,
    private router: Router,
    private sharingService: ConversationSharingService
  ) {
    addIcons({addCircleOutline})
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('sharedConversationId');
      if (id) {
        this.sharedConversationId = id;
        this.loadSharedConversation();
      }
    });
  }

  async addToMyConversations() {
    this.isAddingConversation = true;
    const reponse = await this.sharingService.importSharedConversation(this.sharedConversationId);
    this.conversationService.conversationsResource.reload();
    this.isAddingConversation = false;
    this.router.navigate(['c', reponse])
  }

  async loadSharedConversation() {
    this.isLoading = true;
    this.error = '';
    
    try {
      // Load conversation metadata
      this.conversation = await this.sharingService.getSharedConversation(this.sharedConversationId);
      
      // Load conversation messages
      this.messages = await this.sharingService.getSharedConversationMessages(this.sharedConversationId);
      
    } catch (error: any) {
      console.error('Error loading shared conversation:', error);
      this.error = error.message || 'Failed to load shared conversation';
      
    } finally {
      this.isLoading = false;
    }
  }
}