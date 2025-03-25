import { Component, OnInit, ResourceStatus } from '@angular/core';
import { ConversationService } from 'src/app/conversation/services/conversation.service';
import { IonItem, IonLabel, IonSpinner, IonList, IonButton, IonText, IonImg, IonThumbnail, IonItemDivider, IonIcon } from "@ionic/angular/standalone";
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { createOutline } from 'ionicons/icons';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  imports: [IonIcon, IonItemDivider, IonImg, IonText, IonButton, IonList, IonSpinner, IonLabel, IonThumbnail, IonItem],
  standalone: true
})
export class SideNavComponent  implements OnInit {
  status = ResourceStatus;
  conversations = this.conversationService.conversationsResource;
  currentConversation = this.conversationService.getCurrentConversation();
  constructor(private conversationService: ConversationService, private router: Router) {
    addIcons({createOutline})
  }

  ngOnInit() {}

  setConversation(conversation: any) {
    if(conversation.conversationId === 'pending') {
      this.newChat();
    } else {
      this.router.navigate(['c', conversation.conversationId])
      this.conversationService.setCurrentConversation(conversation);
    }
  }

  newChat() {
    this.conversationService.createNewConversation();
  }




}
