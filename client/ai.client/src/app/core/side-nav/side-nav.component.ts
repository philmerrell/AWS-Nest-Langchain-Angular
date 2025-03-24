import { Component, OnInit, ResourceStatus } from '@angular/core';
import { ConversationService } from 'src/app/conversation/services/conversation.service';
import { IonItem, IonLabel, IonSpinner, IonList, IonButton } from "@ionic/angular/standalone";
import { Conversation } from 'src/app/conversation/services/conversation.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  imports: [IonButton, IonList, IonSpinner, IonLabel, IonItem],
  standalone: true
})
export class SideNavComponent  implements OnInit {
  status = ResourceStatus;
  conversations = this.conversationService.conversationsResource;
  currentConversation = this.conversationService.getCurrentConversation();
  constructor(private conversationService: ConversationService, private router: Router) { }

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
