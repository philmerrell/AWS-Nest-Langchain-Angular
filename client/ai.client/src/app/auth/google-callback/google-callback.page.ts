import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-google-callback',
  templateUrl: './google-callback.page.html',
  styleUrls: ['./google-callback.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class GoogleCallbackPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
