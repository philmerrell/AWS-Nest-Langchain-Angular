// client/ai.client/src/app/conversation/components/conversation-text/user-message/user-message.component.ts
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { TruncateUserInputPipe } from "../truncate-user-input.pipe";
import { addIcons } from 'ionicons';
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import { Message } from 'src/app/conversation/services/conversation.model';
import { expandCollapse } from 'src/app/shared/animations/expandCollapse';

@Component({
  selector: 'app-user-message',
  templateUrl: './user-message.component.html',
  styleUrls: ['./user-message.component.scss'],
  animations: [expandCollapse],
  standalone: true,
  imports: [IonIcon, IonButton, TruncateUserInputPipe]
})
export class UserMessageComponent implements OnInit {
  @Input() message!: Message;
  startHeight: string = '';
  expanded: boolean = false;
  textContent: string = '';

  constructor() {
    addIcons({chevronDownOutline, chevronUpOutline});
  }

  ngOnInit() {
    // Extract text content from content blocks
    this.extractTextContent();
  }

  extractTextContent() {
    if (Array.isArray(this.message.content)) {
      // Combine all text blocks
      this.textContent = this.message.content
        .filter(block => 'text' in block)
        .map(block => (block as any).text)
        .join('\n');
    } else {
      // Fallback for backward compatibility with old message format
      this.textContent = this.message.content as unknown as string;
    }
  }
}