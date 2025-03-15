import { Component, OnInit, Signal } from '@angular/core';
import { addIcons } from 'ionicons';
import { IonIcon, IonTextarea, IonButton, IonCardContent, IonCard } from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
import { arrowUpOutline, stop, close } from 'ionicons/icons';

@Component({
  selector: 'app-chat-input',
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.scss'],
  standalone: true,
  imports: [IonCard, IonCardContent, IonButton, IonTextarea, IonIcon, IonButton, IonIcon, IonCard, IonTextarea, FormsModule]
})
export class ChatInputComponent  implements OnInit {
  message: string = '';
  loading: boolean = false;
  error = '';
  
  constructor() {
    addIcons({close, stop, arrowUpOutline});
  }

  ngOnInit() {}


  handleSubmitChat() {
    
  }

  handleEnterKey(event: any) {
    if (event.which === 13 && !event.shiftKey) {
      event.preventDefault();
      // this.submitChatRequest();
    }
  }

  private submitChatRequest() {
    const message = this.message.trim();
    if (message !== '') {
      // this.chatRequestService.submitChatRequest(this.message);
    }
    this.message = ''
  }

  private cancelChatRequest() {
    // this.chatRequestService.cancelChatRequest();
  }

}
