import { effect, Injectable, Resource, resource, Signal, signal, WritableSignal } from '@angular/core';
import { Conversation, Message, Model } from './conversation.model';
import { ModelService } from './model.service';
import { PromptService } from './prompt.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { lastValueFrom, map, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {  
  private currentConversation: WritableSignal<Conversation> = signal({} as Conversation);

  private _conversationsResource = resource({
    loader: () => this.loadConversations()
  })

  get conversationsResource() {
    return this._conversationsResource
  }

  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    effect(() => {
      // if(!this.currentConversation().conversationId) {
      //   window.history.pushState(null, '', ``);
      // } else {
      //   // window.history.pushState(null, '', `c/${this.currentConversation().conversationId}`);
      //   this.router.navigate(['c', this.currentConversation().conversationId])
      // //   console.log('routing to c')
        
      // }
      
    })
  }

  updateConversations() {

  }

  createNewConversation() {
    const conversations = this.getConversations().value;
    const pendingConversation = conversations()?.find(conversation => conversation.conversationId === 'pending');
    if (pendingConversation) {
      this.setCurrentConversation(pendingConversation);
    } else {
      const newConversation = { name: 'New Chat', conversationId: 'pending' } as Conversation;
      this.setCurrentConversation(newConversation);
      this.addConversation(newConversation);
    }
    this.router.navigate(['']);
  }

  addConversation(conversation: Conversation) {
    this._conversationsResource.update(conversations => {
      return conversations ? [conversation, ...conversations] : [conversation];
    })
  }

  getCurrentConversation(): WritableSignal<Conversation> {
    return this.currentConversation;
  }

  // getConversationById(conversationId: string) {
  //   const response = this.http.get
  // }

  updatePendingConversationId(id: string) {
    window.history.pushState(null, '', `c/${this.currentConversation().conversationId}`);
    this._conversationsResource.update(conversations => {
      return conversations?.map(conversation => 
        conversation.conversationId === 'pending' 
          ? { ...conversation, conversationId: id } 
          : conversation
      );
    })
  }

  async setCurrentConversation(conversation: Conversation) {
    this.currentConversation.set(conversation);
  }

  setCurrentConversationId(id: string = 'pending') {
    this.currentConversation.update(conversation => {
      return {
        ...conversation,
        conversationId: id
      }
    })
  }

  getConversations() {
    return this._conversationsResource;
  }

  getMessages(conversationId: string): Promise<Message[]> {
    const request = this.http.get<Message[]>(`${environment.chatApiUrl}/messages/${conversationId}`);
    return lastValueFrom(request);
  }

  loadConversations() {
    const request = this.http.get<{ lastEvaluatedKey: String, items: Conversation[] }>(`${environment.chatApiUrl}/conversations`)
      .pipe(map(response => { 
        return [
          // newConversation,
          ...response.items
        ]
      }));
    return lastValueFrom(request)
  }

  loadConversationById(id: string): Promise<Conversation> {
    const request = this.http.get<Conversation>(`${environment.chatApiUrl}/conversations/${id}`);
    return lastValueFrom(request);
  }

  setConversations(conversations: Conversation[]) {
    this._conversationsResource.set(conversations);
  }

}
