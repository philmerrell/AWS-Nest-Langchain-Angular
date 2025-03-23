import { effect, Injectable, resource, Signal, signal, WritableSignal } from '@angular/core';
import { Conversation, Message, Model } from './conversation.model';
import { ModelService } from './model.service';
import { PromptService } from './prompt.service';
import { AuthService } from 'src/app/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { lastValueFrom, map, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {  
  private currentConversationId: WritableSignal<string> = signal('');
  private currentConversation: WritableSignal<Conversation> = signal({} as Conversation);

  private conversations: WritableSignal<Conversation[]> = signal([]);

  private _conversationsResource = resource({
    loader: () => this.getAllConversations()
  })

  get conversationsResource() {
    return this._conversationsResource.asReadonly()
  }

  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    effect(() => {
      if(this.currentConversationId() !== '') {
        window.history.pushState(null, '', `c/${this.currentConversationId()}`);
        this.router.navigate(['c', this.currentConversationId()])
      }
    })
  }

  getCurrentConversation(): WritableSignal<Conversation> {
    return this.currentConversation;
  }

  async setCurrentConversation(conversation: Conversation) {
    this.currentConversation.set(conversation);
  }

  setCurrentConversationId(id: string) {
    this.currentConversationId.set(id);
  }

  getCurrentConversationId() {
    return this.currentConversationId;
  }

  getConversations(): WritableSignal<Conversation[]> {
    return this.conversations;
  }

  getMessages(conversationId: string): Promise<Message[]> {
    const request = this.http.get<Message[]>(`${environment.chatApiUrl}/messages/${conversationId}`);
    return lastValueFrom(request);
  }

  getAllConversations() {
    const request = this.http.get<{ lastEvaluatedKey: String, items: Conversation[] }>(`${environment.chatApiUrl}/conversations`)
      .pipe(map(response => { console.log(response); return response.items}));
    return lastValueFrom(request)
  }

  private createConversation() {
    
  }

  setConversations(conversations: Conversation[]) {
    this.conversations.set(conversations);
  }

}
