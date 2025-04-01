// client/ai.client/src/app/core/conversation-actions/conversation-actions.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { IonItem, IonIcon, IonList, ModalController, PopoverController, AlertController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shareOutline, trashOutline, downloadOutline, pencilOutline, starOutline, star } from 'ionicons/icons';
import { Conversation } from 'src/app/conversation/services/conversation.model';
import { ShareConversationComponent } from 'src/app/conversation/components/share-conversation/share-conversation.component';
import { ConversationService } from 'src/app/conversation/services/conversation.service';

@Component({
  selector: 'app-conversation-actions',
  template: `
    <ion-list>
      <ion-item button (click)="toggleStar()">
        <ion-icon [name]="conversation.isStarred ? 'star' : 'star-outline'" slot="start" color="warning"></ion-icon>
        {{ conversation.isStarred ? 'Unstar' : 'Star' }}
      </ion-item>
      <ion-item button (click)="shareConversation()">
        <ion-icon name="share-outline" slot="start" color="primary"></ion-icon>
        Share
      </ion-item>
      
      <ion-item button (click)="renameConversation()">
        <ion-icon name="pencil-outline" slot="start" color="primary"></ion-icon>
        Rename
      </ion-item>

      <ion-item button (click)="deleteConversation()">
        <ion-icon name="trash-outline" slot="start" color="danger"></ion-icon>
        Delete
      </ion-item>
      
    </ion-list>
  `,
  styles: [`
    ion-list {
      margin: 0;
      padding: 0;
    }
  `],
  standalone: true,
  imports: [IonList, IonItem, IonIcon]
})
export class ConversationActionsComponent implements OnInit {
  @Input() conversation!: Conversation;
  
  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private popoverController: PopoverController,
    private modalController: ModalController,
    private conversationService: ConversationService
  ) {
    addIcons({
      shareOutline,
      trashOutline,
      downloadOutline,
      pencilOutline,
      starOutline,
      star
    });
  }

  ngOnInit() {}

  async shareConversation() {
    // Close the popover first
    await this.popoverController.dismiss();
    
    // Open the share modal
    const modal = await this.modalController.create({
      component: ShareConversationComponent,
      componentProps: {
        conversation: this.conversation
      }
    });
    
    await modal.present();
  }

  async deleteConversation() {
    this.popoverController.dismiss();
    
    const alert = await this.alertController.create({
      header: 'Delete Conversation',
      message: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              // Call your conversation service to delete the conversation
              await this.conversationService.deleteConversation(this.conversation.conversationId);
              
              // Show success message
              const toast = await this.toastController.create({
                message: 'Conversation deleted successfully',
                duration: 2000,
                color: 'success'
              });
              toast.present();
            } catch (error) {
              console.error('Error deleting conversation:', error);
              
              // Show error message
              const toast = await this.toastController.create({
                message: 'Failed to delete conversation',
                duration: 2000,
                color: 'danger'
              });
              toast.present();
            }
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async renameConversation() {
    this.popoverController.dismiss();
    
    const alert = await this.alertController.create({
      header: 'Rename Conversation',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Enter a new name',
          value: this.conversation.name
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Rename',
          handler: async (data) => {
            if (data.name && data.name.trim() !== '') {
              try {
                // Update the conversation name locally
                this.conversationService.updateConversationName(
                  this.conversation.conversationId, 
                  data.name.trim()
                );
                
                // Update the conversation name on the server
                await this.conversationService.updateConversationNameOnServer(
                  this.conversation.conversationId,
                  data.name.trim()
                );
                
                // Show success message
                const toast = await this.toastController.create({
                  message: 'Conversation renamed successfully',
                  duration: 2000,
                  color: 'success',
                  position: 'bottom'
                });
                toast.present();
                
              } catch (error) {
                console.error('Error renaming conversation:', error);
                
                // Show error message
                const toast = await this.toastController.create({
                  message: 'Failed to rename conversation',
                  duration: 2000,
                  color: 'danger',
                  position: 'bottom'
                });
                toast.present();
              }
            }
          }
        }
      ]
    });
    
    await alert.present();
  }

  async toggleStar() {
    this.popoverController.dismiss();
    
    try {
      // The isStarred property is still boolean in the frontend
      const newStarredState = !this.conversation.isStarred;
      
      // The conversation service will handle converting boolean to 0/1 for the backend
      await this.conversationService.toggleStar(this.conversation.conversationId, newStarredState);
      
      // Show success message
      const toast = await this.toastController.create({
        message: newStarredState 
          ? 'Conversation moved to starred'
          : 'Conversation removed from starred',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      toast.present();
    } catch (error) {
      console.error('Error toggling star status:', error);
      
      // Show error message
      const toast = await this.toastController.create({
        message: 'Failed to update starred status',
        duration: 2000,
        color: 'danger',
        position: 'bottom'
      });
      toast.present();
    }
  }
  
  async exportConversation() {
    // Implement export functionality
    this.popoverController.dismiss();
    
    // Logic for exporting conversation would go here
  }
  
}