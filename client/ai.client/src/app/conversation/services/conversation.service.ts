import { Injectable, resource, signal, WritableSignal } from '@angular/core';
import { Conversation } from './conversation.model';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { lastValueFrom, map, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {  
  private currentConversation: WritableSignal<Conversation> = signal({conversationId: 'pending', name: ''} as Conversation);

  private _conversationsResource = resource({
    loader: () => this.loadConversations()
  })

  get conversationsResource() {
    return this._conversationsResource
  }
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}


  updateCurrentConversationName(name: string) {
    const currentConversation = this.currentConversation();
    if (currentConversation) {
      this.updateConversationName(currentConversation.conversationId, name);
      this.currentConversation.update(conversation => ({
        ...conversation,
        name
      }));
    }
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

  updatePendingConversationId(conversationId: string) {
    window.history.pushState(null, '', `c/${conversationId}`);
    // this.router.navigate([`c/${conversationId}`])
    this._conversationsResource.update(conversations => {
      return conversations?.map(conversation => 
        conversation.conversationId === 'pending' 
          ? { ...conversation, conversationId } 
          : conversation
      );
    })
  }

  updateConversationName(conversationId: string, name: string) {
    console.log('update conversation name')
    this._conversationsResource.update(conversations => {
      return conversations?.map(conversation => 
        conversation.conversationId === conversationId 
          ? { ...conversation, name } 
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

  

  loadConversations() {
    const newConversation = { conversationId: 'pending', name: 'New Chat'}
    const request = this.http.get<{ lastEvaluatedKey: String, items: Conversation[] }>(`${environment.chatApiUrl}/conversations`)
      .pipe(map(response => { 
        return [
          newConversation,
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
