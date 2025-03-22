
import { Component } from '@angular/core';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { SideNavComponent } from './core/side-nav/side-nav.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonSplitPane, IonMenu, IonContent, IonRouterOutlet, SideNavComponent],
})
export class AppComponent {
  
  
  constructor() {
    addIcons({});
  }
}
