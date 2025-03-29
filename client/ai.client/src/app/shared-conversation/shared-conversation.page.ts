import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonBackButton, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonSkeletonText, IonItem, IonLabel } from '@ionic/angular/standalone';
import { MarkdownComponent } from 'ngx-markdown';
import { ConversationSharingService, SharedConversation, SharedMessage } from '../conversation/services/conversation-sharing.service';
import { DatePipe } from '@angular/common';
import { ConversationTextComponent } from '../conversation/components/conversation-text/conversation-text.component';

@Component({
  selector: 'app-shared-conversation',
  templateUrl: './shared-conversation.page.html',
  styleUrls: ['./shared-conversation.page.scss'],
  standalone: true,
  imports: [IonLabel, IonItem, 
    ConversationTextComponent, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
    IonBackButton, IonCard, IonCardHeader, IonCardTitle, 
    IonCardContent, DatePipe
  ],
})
export class SharedConversationPage implements OnInit {
  sharedConversationId = '';
  conversation: SharedConversation | null = null;
  messages: SharedMessage[] = [];
  isLoading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private sharingService: ConversationSharingService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('sharedConversationId');
      if (id) {
        this.sharedConversationId = id;
        this.loadSharedConversation();
      }
    });
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