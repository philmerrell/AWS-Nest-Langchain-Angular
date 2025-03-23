import { Component, OnInit, ResourceStatus } from '@angular/core';
import { ConversationService } from 'src/app/conversation/services/conversation.service';
import { IonItem, IonLabel, IonSpinner, IonList } from "@ionic/angular/standalone";

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  imports: [IonList, IonSpinner, IonLabel, IonItem],
  standalone: true
})
export class SideNavComponent  implements OnInit {
  status = ResourceStatus;
  conversations = this.conversationService.conversationsResource;

  constructor(private conversationService: ConversationService) { }

  ngOnInit() {}




}
