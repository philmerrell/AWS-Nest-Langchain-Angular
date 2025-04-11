// client/ai.client/src/app/conversation/components/conversation-text/conversation-text.component.ts
import { Component, effect, input, OnInit } from '@angular/core';
import { IonRow, IonCol, IonContent, IonButton, IonChip, IonAvatar, IonLabel, IonCard } from "@ionic/angular/standalone";
import { MarkdownComponent } from 'ngx-markdown';
import { addIcons } from 'ionicons';
import { documentOutline, downloadOutline, imageOutline, listOutline, readerOutline, chevronDownOutline } from 'ionicons/icons';
import { UserMessageComponent } from './user-message/user-message.component';
import { fadeInOut } from 'src/app/shared/animations/fadeInOut';
import { slide } from 'src/app/shared/animations/slide';
import { ContentBlock, Message, ToolResult } from '../../services/conversation.model';
import { ToolResultComponent } from './tool-result/tool-result.component';

@Component({
  selector: 'app-conversation-text',
  templateUrl: './conversation-text.component.html',
  styleUrls: ['./conversation-text.component.scss'],
  animations: [fadeInOut, slide],
  imports: [
    IonLabel, 
    IonAvatar, 
    IonChip, 
    IonButton, 
    IonCard, 
    UserMessageComponent, 
    ToolResultComponent,
    IonRow, 
    IonCol, 
    MarkdownComponent
  ],
  standalone: true,
})
export class ConversationTextComponent implements OnInit {
  readonly messages = input<Message[]>();
  readonly loading = input<boolean>();
  readonly scroller = input<IonContent>();
  showReasoning: boolean = false;
  
  constructor() {
    addIcons({chevronDownOutline, downloadOutline, readerOutline, documentOutline, imageOutline, listOutline});
    effect(() => {
      if(this.messages()) {
        if((this.messages() ?? []).length > 3) {
          // this.scrollToLatestUserMessage()
        }
      }
    });
  }

  ngOnInit() {}

  toggleReasoning() {
    this.showReasoning = !this.showReasoning;
  }

  getTextContent(contentBlocks: ContentBlock[]): string {
    if (!Array.isArray(contentBlocks)) {
      // Fallback for backward compatibility
      return contentBlocks as unknown as string;
    }
    
    return contentBlocks
      .filter(block => 'text' in block)
      .map(block => (block as any).text)
      .join('\n');
  }

  getToolUseBlocks(contentBlocks: ContentBlock[]): any[] {
    if (!Array.isArray(contentBlocks)) {
      return [];
    }
    
    return contentBlocks.filter(block => 'toolUse' in block);
  }

  scrollToLatestUserMessage() {
    setTimeout(() => {
      this.scroller()?.scrollToBottom();
    }, 300);
  }
}