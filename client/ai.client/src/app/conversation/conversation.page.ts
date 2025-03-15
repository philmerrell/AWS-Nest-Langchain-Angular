import { Component, OnInit, Signal  } from '@angular/core';
import { ChatInputComponent } from './components/chat-input/chat-input.component';
import { addIcons } from 'ionicons';
import { chevronForwardOutline, personOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonButtons, IonTitle, IonContent, IonFooter, IonMenuButton } from "@ionic/angular/standalone";

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.page.html',
  styleUrls: ['./conversation.page.scss'],
  standalone: true,
  imports: [IonFooter, IonContent, IonTitle, IonButtons, IonToolbar, IonHeader, ChatInputComponent, IonMenuButton ]
})
export class ConversationPage implements OnInit {
  isModalOpen = false;

  constructor() {
    addIcons({chevronForwardOutline});
  }

  ngOnInit() {

  }




}
