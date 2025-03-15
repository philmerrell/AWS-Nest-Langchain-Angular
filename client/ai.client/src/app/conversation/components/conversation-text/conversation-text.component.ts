import { Component, effect, input, OnInit, Signal } from '@angular/core';
import { Conversation } from 'src/app/models/conversation.model';
import { IonGrid, IonRow, IonCol, IonContent, IonChip, IonIcon, IonLabel, IonAvatar } from "@ionic/angular/standalone";
import { MarkdownComponent } from 'ngx-markdown';
import { FileTypeIconPipe } from "../select-uploaded-file/pipes/file-type-icon.pipe";
import { addIcons } from 'ionicons';
import { documentOutline, downloadOutline, imageOutline, listOutline, readerOutline, chevronDownOutline } from 'ionicons/icons';
import { ResponseMetadata, ResponseMetadataService } from '../../services/response-metadata.service';
import { fadeInOut } from 'src/app/core/animations/fadeInOut';
import { slide } from 'src/app/core/animations/slide';
import { UserMessageComponent } from './user-message/user-message.component';
import { JsonPipe } from '@angular/common';
import { HelpCardComponent } from '../help-card/help-card.component';

@Component({
  selector: 'app-conversation-text',
  templateUrl: './conversation-text.component.html',
  styleUrls: ['./conversation-text.component.scss'],
  animations: [fadeInOut, slide],
  imports: [HelpCardComponent, UserMessageComponent, IonAvatar, IonLabel, IonIcon, IonChip, IonGrid, IonRow, IonCol, MarkdownComponent, FileTypeIconPipe, JsonPipe],
  standalone: true,
})
export class ConversationTextComponent  implements OnInit {
  readonly conversation = input<Conversation>();
  readonly loading = input<boolean>();
  readonly scroller = input<IonContent>();
  responseMetadata: Signal<ResponseMetadata[]> = this.responseMetadataService.getResponseMetaData();
  
  constructor(private responseMetadataService: ResponseMetadataService) {
    
    addIcons({chevronDownOutline,downloadOutline,readerOutline,documentOutline,imageOutline,listOutline});
    effect(() => {
      if(this.conversation()) {
        if (this.conversation()?.messages) {
          if(this.conversation()!.messages?.length > 3) {
            this.scrollToLatestUserMessage()
          }
        }
      }
    })

  }

  ngOnInit() {}

  scrollToLatestUserMessage() {
    const lastUserMessage = this.conversation()?.messages.filter(item => item.role === 'user').pop();
    if(lastUserMessage) {
      setTimeout(async () => {
        const element = document.getElementById(lastUserMessage.id);
        this.scroller()?.scrollByPoint(0, element!.offsetTop, 700);
      }, 300)
    }
  }

  downloadFile(file: any) {
    console.log(file.key);
    // TODO: download file service...
  }

  


}
