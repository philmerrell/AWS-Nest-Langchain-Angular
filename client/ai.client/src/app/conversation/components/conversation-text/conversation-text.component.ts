import { Component, effect, input, OnInit, Signal } from '@angular/core';
import { IonGrid, IonRow, IonCol, IonContent } from "@ionic/angular/standalone";
import { MarkdownComponent } from 'ngx-markdown';
import { addIcons } from 'ionicons';
import { documentOutline, downloadOutline, imageOutline, listOutline, readerOutline, chevronDownOutline } from 'ionicons/icons';
import { UserMessageComponent } from './user-message/user-message.component';
import { fadeInOut } from 'src/app/shared/animations/fadeInOut';
import { slide } from 'src/app/shared/animations/slide';
import { Conversation, Message } from '../../services/conversation.model';

@Component({
  selector: 'app-conversation-text',
  templateUrl: './conversation-text.component.html',
  styleUrls: ['./conversation-text.component.scss'],
  animations: [fadeInOut, slide],
  imports: [ UserMessageComponent, IonGrid, IonRow, IonCol, MarkdownComponent],
  standalone: true,
})
export class ConversationTextComponent  implements OnInit {
  readonly messages = input<Message[]>();
  readonly loading = input<boolean>();
  readonly scroller = input<IonContent>();
  
  constructor() {
    
    addIcons({chevronDownOutline,downloadOutline,readerOutline,documentOutline,imageOutline,listOutline});
    effect(() => {
      if(this.messages()) {
          if((this.messages() ?? []).length > 3) {
            
            // this.scrollToLatestUserMessage()
          }
        
      }
    })

  }

  ngOnInit() {}

  scrollToLatestUserMessage() {
    
      setTimeout(() => {
        this.scroller()?.scrollToBottom();
        // const element = document.getElementById(lastUserMessage.id ?? '');
        // this.scroller()?.scrollByPoint(0, element!.offsetTop, 700);
      }, 300)
    
  }

}
