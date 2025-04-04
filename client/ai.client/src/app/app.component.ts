// src/app/app.component.ts
import { Component, Inject, OnInit, Optional } from '@angular/core';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonRouterOutlet, IonItem, IonImg, IonLabel, IonButton, IonIcon, IonText, IonThumbnail } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { SideNavComponent } from './core/side-nav/side-nav.component';
import { addCircle } from 'ionicons/icons';
import { Router } from '@angular/router';
import { ConversationService } from './conversation/services/conversation.service';
import { AuthService } from './auth/auth.service';
import { ThemeService } from './core/theme.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonButton, IonText, IonIcon, IonLabel, IonImg, IonItem, IonApp, IonSplitPane, IonMenu, IonContent, IonRouterOutlet, SideNavComponent, IonThumbnail],
})
export class AppComponent implements OnInit {
  currentUser = this.authService.currentUser;
  logo$: Observable<string> = this.themeService.logo$;

  constructor(
    private authService: AuthService,
    private conversationService: ConversationService,
    private router: Router,
    private themeService: ThemeService,
    @Optional() @Inject('INIT_APP') private initService: any[]
  ) {
    addIcons({addCircle});
  }

  async ngOnInit() {
    // Wait for any initialization to complete
    if (this.initService && this.initService.length > 0) {
      for (const initializer of this.initService) {
        try {
          await initializer();
        } catch (error) {
          console.error('Initialization error:', error);
        }
      }
    }
  }

  newChat() {
    this.conversationService.setCurrentConversation({ conversationId: 'pending', name: 'New Chat'})
    this.router.navigate(['/']);
  }
}