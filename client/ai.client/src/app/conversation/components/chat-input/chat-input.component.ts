import { Component, OnInit, Signal } from '@angular/core';
import { addIcons } from 'ionicons';
import { IonIcon, IonTextarea, IonButton, IonCardContent, IonCard } from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
import { arrowUpOutline, stop, close } from 'ionicons/icons';
import { ChatRequestService } from '../../services/chat-request.service';

@Component({
  selector: 'app-chat-input',
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.scss'],
  standalone: true,
  imports: [IonCard, IonCardContent, IonButton, IonTextarea, IonButton, IonCard, IonTextarea, FormsModule, IonIcon]
})
export class ChatInputComponent  implements OnInit {
  chatLoading: Signal<boolean> = this.chatRequestService.getChatLoading();
  message: string = '';
  loading: boolean = false;
  error = '';
  
  constructor(private chatRequestService: ChatRequestService) {
    addIcons({close, stop, arrowUpOutline});
  }

  ngOnInit() {}


  handleSubmitChat() {
    if (this.chatLoading()) {
      this.cancelChatRequest()
    } else {
      this.submitChatRequest()
    }
  }

  handleEnterKey(event: any) {
    if (event.which === 13 && !event.shiftKey) {
      event.preventDefault();
      if (!this.chatLoading()) {
        this.submitChatRequest();
      }
    }
  }

  private submitChatRequest() {
    const message = this.message.trim();
    if (message !== '') {
      this.chatRequestService.submitChatRequest(this.message, new AbortController().signal);
    }
    this.message = ''
  }

  private cancelChatRequest() {
    // this.chatRequestService.cancelChatRequest();
  }

}
