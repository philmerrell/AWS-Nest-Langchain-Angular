import { Component, effect, input, OnInit, signal } from '@angular/core';
import { IonRow, IonCol, IonContent, IonButton, IonChip, IonAvatar, IonLabel, IonCard, IonSpinner, IonIcon, IonBadge } from "@ionic/angular/standalone";
import { MarkdownComponent } from 'ngx-markdown';
import { addIcons } from 'ionicons';
import { documentOutline, downloadOutline, imageOutline, listOutline, readerOutline, chevronDownOutline, buildOutline, hammerOutline } from 'ionicons/icons';
import { UserMessageComponent } from './user-message/user-message.component';
import { fadeInOut } from 'src/app/shared/animations/fadeInOut';
import { slide } from 'src/app/shared/animations/slide';
import { ContentBlock, Message, ToolResult } from '../../services/conversation.model';
import { ToolResultComponent } from './tool-result/tool-result.component';
import { ToolStatusComponent } from './tool-status/tool-status.component';

@Component({
  selector: 'app-conversation-text',
  templateUrl: './conversation-text.component.html',
  styleUrls: ['./conversation-text.component.scss'],
  animations: [fadeInOut, slide],
  imports: [
    IonBadge,
    IonSpinner,
    IonIcon,
    IonLabel, 
    IonAvatar, 
    IonChip, 
    IonButton, 
    IonCard, 
    UserMessageComponent, 
    ToolResultComponent,
    ToolStatusComponent,
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
    addIcons({
      chevronDownOutline, 
      downloadOutline, 
      readerOutline, 
      documentOutline, 
      imageOutline, 
      listOutline,
      buildOutline,
      hammerOutline
    });
    
    effect(() => {
      if(this.messages()) {
        if((this.messages() ?? []).length > 3) {
          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
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
      .join('');
  }

  getToolUseBlocks(contentBlocks: ContentBlock[]): any[] {
    if (!Array.isArray(contentBlocks)) {
      return [];
    }
    
    return contentBlocks.filter(block => 'toolUse' in block);
  }

  isToolActive(message: Message): boolean {
    return !!message.toolStatus?.inProgress;
  }

  hasReasoning(message: Message): boolean {
    return !!message.reasoning && message.reasoning.length > 0;
  }

  scrollToBottom() {
    this.scroller()?.scrollToBottom(300);
  }

  isLastMessage(index: number): boolean {
    const messagesArray = this.messages() || [];
    return messagesArray && index === messagesArray.length - 1;
  }
}