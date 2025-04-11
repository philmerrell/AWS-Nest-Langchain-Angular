import { Component, effect, input, OnInit } from '@angular/core';
import { IonRow, IonCol, IonContent, IonButton, IonChip, IonAvatar, IonLabel, IonCard, IonIcon } from "@ionic/angular/standalone";
import { MarkdownComponent } from 'ngx-markdown';
import { addIcons } from 'ionicons';
import { documentOutline, downloadOutline, imageOutline, listOutline, readerOutline, chevronDownOutline } from 'ionicons/icons';
import { UserMessageComponent } from './user-message/user-message.component';
import { fadeInOut } from 'src/app/shared/animations/fadeInOut';
import { slide } from 'src/app/shared/animations/slide';
import { ContentBlock, Message, TextContentBlock, ToolResultContentBlock, ToolUseContentBlock } from '../../services/conversation.model';
import { ToolResultComponent } from './tool-result/tool-result.component';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-conversation-text',
  templateUrl: './conversation-text.component.html',
  styleUrls: ['./conversation-text.component.scss'],
  animations: [fadeInOut, slide],
  imports: [IonIcon,
    JsonPipe,
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
      .map(block => (block as TextContentBlock).text)
      .join('\n');
  }

  getToolUseBlocks(contentBlocks: ContentBlock[]): ToolUseContentBlock[] {
    if (!Array.isArray(contentBlocks)) {
      return [];
    }
    
    return contentBlocks.filter(block => 'toolUse' in block) as ToolUseContentBlock[];
  }
  
  getToolResultBlocks(contentBlocks: ContentBlock[]): ToolResultContentBlock[] {
    if (!Array.isArray(contentBlocks)) {
      return [];
    }
    
    return contentBlocks.filter(block => 'toolResult' in block) as ToolResultContentBlock[];
  }
  
  // Get a tool result for a specific tool use ID
  getToolResultForToolUse(contentBlocks: ContentBlock[], toolUseId: string): ToolResultContentBlock | undefined {
    if (!Array.isArray(contentBlocks)) {
      return undefined;
    }
    
    return contentBlocks.find(
      block => 'toolResult' in block && 
      (block as ToolResultContentBlock).toolResult.toolUseId === toolUseId
    ) as ToolResultContentBlock | undefined;
  }
  
  // Get tool result text content
  getToolResultText(toolResult: ToolResultContentBlock): string {
    if (!toolResult.toolResult.content || !Array.isArray(toolResult.toolResult.content)) {
      return '';
    }
    
    return toolResult.toolResult.content
      .filter(item => 'text' in item)
      .map(item => item.text)
      .join('\n');
  }

  scrollToLatestUserMessage() {
    setTimeout(() => {
      this.scroller()?.scrollToBottom();
    }, 300);
  }
}