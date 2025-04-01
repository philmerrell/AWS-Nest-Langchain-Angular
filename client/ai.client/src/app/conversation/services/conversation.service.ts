import { Injectable, resource, signal, WritableSignal } from '@angular/core';
import { Conversation } from './conversation.model';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { firstValueFrom, lastValueFrom, map, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {  
  private currentConversation: WritableSignal<Conversation> = signal({conversationId: 'pending', name: ''} as Conversation);

  private _conversationsResource = resource({
    request: () => ({isAuthenticated: this.authService.isLoggedIn(), user: this.authService.currentUser()}), 
    loader: ({request}) => {
      if(request.isAuthenticated === false) {
        return Promise.resolve([]);
      } else {
        return this.loadConversations();
      }
    }
  })

  get conversationsResource() {
    return this._conversationsResource
  }
  
  constructor(
    private authService: AuthService,
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
  }

  addConversation(conversation: Conversation) {
    this._conversationsResource.update(conversations => {
      return conversations ? [conversation, ...conversations] : [conversation];
    })
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      // Make the API call to delete the conversation
      await lastValueFrom(
        this.http.delete<any>(`${environment.chatApiUrl}/conversations/${conversationId}`)
      );
      
      // Update local state by removing the conversation
      this._conversationsResource.update(conversations => {
        return conversations?.filter(conversation => 
          conversation.conversationId !== conversationId
        );
      });
      
      // If the deleted conversation was the current one, create a new conversation
      const currentConversation = this.currentConversation();
      if (currentConversation.conversationId === conversationId) {
        this.router.navigate(['/'])
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return Promise.reject(error);
    }
  }

  getCurrentConversation(): WritableSignal<Conversation> {
    return this.currentConversation;
  }

  async updateConversationNameOnServer(conversationId: string, name: string): Promise<void> {
    try {
      await lastValueFrom(
        this.http.patch(`${environment.chatApiUrl}/conversations/${conversationId}/name`, { name })
      );
      
      // If this is the current conversation, update its name in the current conversation signal as well
      const currentConversation = this.currentConversation();
      if (currentConversation && currentConversation.conversationId === conversationId) {
        this.updateCurrentConversationName(name);
      }
    } catch (error) {
      console.error('Error updating conversation name on server:', error);
      throw error;
    }
  }

  updatePendingConversationId(conversationId: string) {
    window.history.pushState(null, '', `c/${conversationId}`);
    // this.router.navigate([`c/${conversationId}`], {})
    // this.navCtrl.navigateForward([`c/${conversationId}`], { animated: false });

    this._conversationsResource.update(conversations => {
      return conversations?.map(conversation => 
        conversation.conversationId === 'pending' 
          ? { ...conversation, conversationId } 
          : conversation
      );
    })
  }

  updateConversationName(conversationId: string, name: string) {
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
    const request = this.http.get<{ lastEvaluatedKey: String, items: Conversation[] }>(`${environment.chatApiUrl}/conversations`)
      .pipe(map(response => { 
        return [
          //newConversation,
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

  async toggleStar(conversationId: string, isStarred: boolean): Promise<void> {
    try {
      // Update server
      await lastValueFrom(
        this.http.patch(`${environment.chatApiUrl}/conversations/${conversationId}/star`, { isStarred })
      );
      
      // Update local state
      this._conversationsResource.update(conversations => {
        return conversations?.map(conversation => 
          conversation.conversationId === conversationId 
            ? { ...conversation, isStarred } 
            : conversation
        );
      });
      
      // If it's the current conversation, update that too
      const currentConversation = this.currentConversation();
      if (currentConversation && currentConversation.conversationId === conversationId) {
        this.currentConversation.update(conversation => ({
          ...conversation,
          isStarred
        }));
      }
    } catch (error) {
      console.error('Error starring conversation:', error);
      throw error;
    }
  }

}
