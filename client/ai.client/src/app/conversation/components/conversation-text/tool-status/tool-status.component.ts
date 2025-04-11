// tool-status.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { buildOutline, hammerOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tool-status',
  template: `
    <ion-card class="tool-status-card">
      <ion-card-header>
        <ion-card-title>
          <ion-icon name="hammer-outline"></ion-icon>
          Using Tool: {{ toolName }}
        </ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <div class="tool-status">
          <ion-spinner name="dots"></ion-spinner>
          <span>Processing with {{ toolName }}...</span>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .tool-status-card {
      margin: 10px 0;
      border-left: 4px solid var(--ion-color-warning);
    }
    
    .tool-status {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    ion-spinner {
      color: var(--ion-color-warning);
    }
  `],
  standalone: true,
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, IonSpinner]
})
export class ToolStatusComponent implements OnInit {
  @Input() toolName: string = '';
  @Input() toolInput: any;
  
  constructor() {
    addIcons({ buildOutline, hammerOutline });
  }

  ngOnInit() {}
}