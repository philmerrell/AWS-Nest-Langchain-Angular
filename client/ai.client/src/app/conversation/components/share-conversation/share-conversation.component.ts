import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, 
  IonInput, IonButton, IonCheckbox, IonDatetime, IonToast, 
  IonButtons, IonIcon, IonFooter, IonList, ModalController, ToastController, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shareOutline, copyOutline, closeOutline } from 'ionicons/icons';
import { ConversationSharingService } from '../../services/conversation-sharing.service';
import { Conversation } from '../../services/conversation.model';
import { Clipboard } from '@capacitor/clipboard';

@Component({
  selector: 'app-share-conversation',
  templateUrl: './share-conversation.component.html',
  styleUrls: ['./share-conversation.component.scss'],
  standalone: true,
  imports: [IonCardContent, IonCardTitle, IonCardHeader, IonCard, 
    ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonItem, IonLabel, IonInput, IonButton, IonCheckbox, IonDatetime, 
    IonButtons, IonIcon, IonFooter, IonList
  ],
})
export class ShareConversationComponent implements OnInit {
  @Input() conversation!: Conversation;
  
  shareForm: FormGroup;
  showDatePicker = false;
  shareableLink = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private sharingService: ConversationSharingService,
    private modalController: ModalController,
    private toastController: ToastController
  ) {
    addIcons({ shareOutline, copyOutline, closeOutline });
    
    this.shareForm = this.fb.group({
      emails: [''],
      isPublic: [false],
      expiresAt: [''],
      hasExpiration: [false]
    });
  }

  ngOnInit() {}

  async shareConversation() {
    if (!this.conversation) return;
    
    this.isLoading = true;
    
    try {
      const formValues = this.shareForm.value;
      
      // Parse emails
      const shareWithEmails = formValues.emails
        ? formValues.emails.split(',').map((email: string) => email.trim()).filter(Boolean)
        : [];
      
      // Set expiration date if needed
      const expiresAt = formValues.hasExpiration ? formValues.expiresAt : undefined;
      
      const result = await this.sharingService.shareConversation({
        conversationId: this.conversation.conversationId,
        shareWithEmails,
        isPublic: formValues.isPublic,
        expiresAt,
      });
      
      // Generate shareable link
      this.shareableLink = await this.sharingService.getShareableLink(
        result.sharedConversationId
      );
      
      // Update shared conversations list
      this.sharingService.refreshSharedConversations();
      
      // Show success message
      const toast = await this.toastController.create({
        message: 'Conversation shared successfully!',
        duration: 2000,
        color: 'success',
      });
      toast.present();
      
    } catch (error) {
      console.error('Error sharing conversation:', error);
      
      // Show error message
      const toast = await this.toastController.create({
        message: 'Failed to share conversation. Please try again.',
        duration: 2000,
        color: 'danger',
      });
      toast.present();
      
    } finally {
      this.isLoading = false;
    }
  }

  async copyLink() {
    if (!this.shareableLink) return;
    
    try {
      await Clipboard.write({ string: this.shareableLink });
      
      const toast = await this.toastController.create({
        message: 'Link copied to clipboard!',
        duration: 2000,
      });
      toast.present();
      
    } catch (error) {
      console.error('Error copying link:', error);
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  toggleExpiration(event: any) {
    const hasExpiration = event.detail.checked;
    if (hasExpiration) {
      // Set default expiration to 7 days from now
      const defaultExpiration = new Date();
      defaultExpiration.setDate(defaultExpiration.getDate() + 7);
      this.shareForm.get('expiresAt')?.setValue(defaultExpiration.toISOString());
    } else {
      this.shareForm.get('expiresAt')?.setValue('');
    }
  }
}