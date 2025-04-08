import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, 
  IonInput, IonButton, IonCheckbox, IonDatetime, IonToast, 
  IonButtons, IonIcon, IonFooter, IonList, ModalController, 
  ToastController, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shareOutline, copyOutline, closeOutline, trashOutline } from 'ionicons/icons';
import { 
  ConversationSharingService, 
  SharedConversation, 
  ShareConversationOptions, 
  UpdateSharedConversationOptions 
} from '../../services/conversation-sharing.service';
import { Conversation } from '../../services/conversation.model';
import { Clipboard } from '@capacitor/clipboard';
import { AlertController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-share-conversation',
  templateUrl: './share-conversation.component.html',
  styleUrls: ['./share-conversation.component.scss'],
  standalone: true,
  imports: [IonCardContent, IonCardTitle, IonCardHeader, IonCard, IonSpinner,
    ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonItem, IonLabel, IonInput, IonButton, IonCheckbox, IonDatetime, 
    IonButtons, IonIcon, IonFooter, IonList
  ],
})
export class ShareConversationComponent implements OnInit {
  @Input() conversation!: Conversation;
  @Input() sharedConversation: SharedConversation | null = null; // Passed when editing
  @Input() mode: 'create' | 'edit' = 'create'; // Default to create mode
  
  shareForm: FormGroup;
  showDatePicker = false;
  shareableLink = '';
  isLoading = false;
  isDeletionLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private sharingService: ConversationSharingService,
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
      addIcons({ shareOutline, copyOutline, closeOutline, trashOutline });
      
      this.shareForm = this.fb.group({
        emails: [''],
        isPublic: [false],
        hasExpiration: [false],
        expiresAt: ['']
      });
  }

  async ngOnInit() {
    if (this.mode === 'edit' && this.sharedConversation) {
      // If in edit mode, load the shared conversation details
      this.isLoading = true;
      try {
        // Generate shareable link if it doesn't exist
        if (!this.shareableLink) {
          this.shareableLink = await this.sharingService.getShareableLink(
            this.sharedConversation.PK
          );
        }
        
        // Initialize form values
        this.shareForm.patchValue({
          emails: this.sharedConversation.shareWithEmails?.join(', ') || '',
          isPublic: this.sharedConversation.isPublic || false,
          hasExpiration: !!this.sharedConversation.expiresAt,
          expiresAt: this.sharedConversation.expiresAt || this.getDefaultExpiryDate()
        });
        
      } catch (error: any) {
        console.error('Error loading shared conversation:', error);
        this.error = error.message || 'Failed to load shared conversation details';
        
        const toast = await this.toastController.create({
          message: this.error ?? 'An unknown error occurred',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      } finally {
        this.isLoading = false;
      }
    }
  }

  async shareConversation() {
    if (!this.conversation && this.mode === 'create') return;
    if (this.mode === 'edit' && !this.sharedConversation) return;
    
    this.isLoading = true;
    this.error = null;
    
    try {
      const formValues = this.shareForm.value;
      
      // Parse emails
      const shareWithEmails = formValues.emails
        ? formValues.emails.split(',').map((email: string) => email.trim()).filter(Boolean)
        : [];
      
      // Set expiration date if needed
      const expiresAt = formValues.hasExpiration ? formValues.expiresAt : undefined;
      
      if (this.mode === 'create') {
        // Create new shared conversation
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
        
        // Show success message
        const toast = await this.toastController.create({
          message: 'Conversation shared successfully!',
          duration: 2000,
          color: 'success',
        });
        toast.present();
      } else if (this.mode === 'edit' && this.sharedConversation) {
        // Update existing shared conversation
        const updateOptions: UpdateSharedConversationOptions = {
          shareWithEmails,
          isPublic: formValues.isPublic
        };
        
        // Set expiration if needed
        if (formValues.hasExpiration) {
          updateOptions.expiresAt = formValues.expiresAt;
        } else {
          // Set to null to remove expiration
          updateOptions.expiresAt = undefined;
        }
        
        // Update shared conversation
        await this.sharingService.updateSharedConversation(
          this.sharedConversation.PK,
          updateOptions
        );
        
        // Show success message
        const toast = await this.toastController.create({
          message: 'Sharing settings updated successfully!',
          duration: 2000,
          color: 'success',
        });
        toast.present();
        
        // Refresh shared conversations list
        // this.sharingService.refreshSharedConversations();
      }
      
    } catch (error: any) {
      console.error('Error sharing conversation:', error);
      this.error = error.message || 'Failed to share conversation. Please try again.';
      
      // Show error message
      const toast = await this.toastController.create({
        message: this.error ?? 'An unknown error occurred',
        duration: 3000,
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
  
  getDefaultExpiryDate(): string {
    const defaultExpiration = new Date();
    defaultExpiration.setDate(defaultExpiration.getDate() + 7); // 7 days from now
    return defaultExpiration.toISOString();
  }
  
  async confirmDelete() {
    if (!this.sharedConversation || this.mode !== 'edit') return;
    
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this shared conversation? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.deleteSharedConversation()
        }
      ]
    });
    
    await alert.present();
  }
  
  async deleteSharedConversation() {
    if (!this.sharedConversation || this.mode !== 'edit') return;
    
    this.isDeletionLoading = true;
    
    try {
      await this.sharingService.deleteSharedConversation(this.sharedConversation.PK);
      
      // Show success message
      const toast = await this.toastController.create({
        message: 'Shared conversation deleted successfully',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      
      // Refresh shared conversations list
      // this.sharingService.refreshSharedConversations();
      
      // Close the modal
      this.modalController.dismiss({ deleted: true });
      
    } catch (error: any) {
      console.error('Error deleting shared conversation:', error);
      
      // Show error message
      const toast = await this.toastController.create({
        message: error.message || 'Failed to delete shared conversation',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isDeletionLoading = false;
    }
  }
}