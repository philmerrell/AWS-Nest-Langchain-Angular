import { Component } from '@angular/core';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonRouterOutlet, IonItem, IonImg, IonLabel, IonButton, IonIcon, IonText, IonThumbnail } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { SideNavComponent } from './core/side-nav/side-nav.component';
import { addCircle } from 'ionicons/icons';
import { Router } from '@angular/router';
import { ConversationService } from './conversation/services/conversation.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonText, IonIcon, IonLabel, IonImg, IonItem, IonApp, IonSplitPane, IonMenu, IonContent, IonRouterOutlet, SideNavComponent, IonThumbnail],
})
export class AppComponent {
  
  
  constructor(private router: Router, private conversationService: ConversationService) {
    addIcons({addCircle})
  }

  newChat() {
    this.conversationService.setCurrentConversation({ conversationId: 'pending', name: 'New Chat'})
    this.router.navigate(['/']);
  }
}
