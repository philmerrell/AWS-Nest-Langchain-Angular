import { Component } from '@angular/core';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonRouterOutlet, IonItem, IonImg, IonLabel, IonButton, IonIcon, IonText, IonThumbnail } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { SideNavComponent } from './core/side-nav/side-nav.component';
import { ConversationService } from './conversation/services/conversation.service';
import { createOutline } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonText, IonIcon, IonButton, IonLabel, IonImg, IonItem, IonApp, IonSplitPane, IonMenu, IonContent, IonRouterOutlet, SideNavComponent, IonThumbnail],
})
export class AppComponent {
  
  
  constructor(private conversationService: ConversationService) {
    addIcons({createOutline})
  }

  newChat() {
    this.conversationService.createNewConversation();
  }
}
