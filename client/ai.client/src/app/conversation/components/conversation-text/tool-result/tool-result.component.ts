// client/ai.client/src/app/conversation/components/conversation-text/tool-result/tool-result.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon } from '@ionic/angular/standalone';
import { ToolResult } from 'src/app/conversation/services/conversation.model';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { MarkdownComponent } from 'ngx-markdown';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-tool-result',
  templateUrl: './tool-result.component.html',
  styleUrls: ['./tool-result.component.scss'],
  standalone: true,
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, MarkdownComponent, JsonPipe]
})
export class ToolResultComponent implements OnInit {
  @Input() toolResult!: ToolResult;
  
  constructor() {
    addIcons({ checkmarkCircleOutline, closeCircleOutline });
  }

  ngOnInit() {}
}