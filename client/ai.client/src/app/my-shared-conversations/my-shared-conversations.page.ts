import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
  IonBackButton, IonList, IonItem, IonLabel, IonSpinner,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonIcon, IonBadge, IonItemDivider, IonButton, ToastController,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, chevronForwardOutline, peopleOutline, globeOutline, pencilOutline, trashOutline } from 'ionicons/icons';
import { ConversationSharingService, SharedConversation } from '../conversation/services/conversation-sharing.service';
import { ShareConversationComponent } from '../conversation/components/share-conversation/share-conversation.component';

@Component({
  selector: 'app-shared-conversations',
  templateUrl: './my-shared-conversations.page.html',
  styleUrls: ['./my-shared-conversations.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonButtons, IonBackButton, IonList, IonItem, IonLabel, 
    IonSpinner, IonCard, IonCardContent, IonCardHeader, 
    IonCardTitle, IonIcon, IonBadge, IonItemDivider, IonButton
  ]
})
export class MySharedConversationsPage implements OnInit {
  sharedConversations: SharedConversation[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private sharingService: ConversationSharingService,
    private router: Router,
    private toastController: ToastController,
    private modalController: ModalController
  ) {
    addIcons({ 
      calendarOutline, 
      chevronForwardOutline, 
      peopleOutline, 
      globeOutline,
      pencilOutline,
      trashOutline
    });
  }

  async ngOnInit() {
    await this.loadSharedConversations();
  }

  async loadSharedConversations() {
    this.isLoading = true;
    this.error = null;
    
    try {
      this.sharedConversations = await this.sharingService.getSharedConversationsForUser();
    } catch (error: any) {
      console.error('Error loading shared conversations:', error);
      this.error = error.message || 'Failed to load shared conversations';
    } finally {
      this.isLoading = false;
    }
  }

  openSharedConversation(conversation: SharedConversation) {
    this.router.navigate(['/shared', conversation.PK]);
  }

  // formatTimeAgo(dateString: string): string {
  //   try {
  //     return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
  //   } catch (e) {
  //     return dateString;
  //   }
  // }

  isExpired(conversation: SharedConversation): boolean {
    if (!conversation.expiresAt) return false;
    return new Date(conversation.expiresAt) < new Date();
  }

  getExpiryStatus(conversation: SharedConversation): string {
    if (!conversation.expiresAt) return 'Never expires';
    
    const expiryDate = new Date(conversation.expiresAt);
    if (expiryDate < new Date()) {
      return 'Expired';
    }
    
    return `Expires `;
  }

  getShareStatus(conversation: SharedConversation): string {
    if (conversation.isPublic) {
      return 'Public';
    }
    
    const shareCount = conversation.shareWithEmails?.length || 0;
    return shareCount === 1 ? '1 person' : `${shareCount} people`;
  }

  async editSharedConversation(event: Event, conversation: SharedConversation) {
    event.stopPropagation();
    
    // Open the share conversation component as a modal
    const modal = await this.modalController.create({
      component: ShareConversationComponent,
      componentProps: {
        sharedConversation: conversation,
        mode: 'edit'
      }
    });
    
    await modal.present();
    
    // Handle modal dismiss
    const { data } = await modal.onDidDismiss();
    if (data?.deleted) {
      // If the conversation was deleted, remove it from the array
      this.sharedConversations = this.sharedConversations.filter(
        c => c.PK !== conversation.PK
      );
    } else {
      // Otherwise, refresh the list to get updated data
      this.loadSharedConversations();
    }
  }
  async deleteSharedConversation(event: Event, conversation: SharedConversation) {
    event.stopPropagation();
    
    try {
      await this.sharingService.deleteSharedConversation(conversation.PK);
      
      // Remove from local array
      this.sharedConversations = this.sharedConversations
        .filter(c => c.PK !== conversation.PK);
      
      // Show success message
      const toast = await this.toastController.create({
        message: 'Shared conversation deleted successfully',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      
      // Show error message
      const toast = await this.toastController.create({
        message: error.message || 'Failed to delete shared conversation',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async refreshConversations(event: any) {
    await this.loadSharedConversations();
    event.target.complete();
  }
}