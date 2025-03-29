import { Component } from '@angular/core';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonRouterOutlet, IonItem, IonImg, IonLabel, IonButton, IonIcon, IonText, IonThumbnail } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { SideNavComponent } from './core/side-nav/side-nav.component';
import { ConversationService } from './conversation/services/conversation.service';
import { addCircle, createOutline } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonText, IonIcon, IonLabel, IonImg, IonItem, IonApp, IonSplitPane, IonMenu, IonContent, IonRouterOutlet, SideNavComponent, IonThumbnail],
})
export class AppComponent {
  
  
  constructor(private conversationService: ConversationService) {
    addIcons({addCircle})
  }

  newChat() {
    this.conversationService.createNewConversation();
  }
}
