import { effect, Injectable, resource, Signal, signal, WritableSignal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Model } from './conversation.model';
import { ModelService } from './model.service';
import { PromptService } from './prompt.service';
import { AuthService } from 'src/app/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { lastValueFrom, map, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {  
  private selectedModel: Signal<Model> = this.modelService.getSelectedModel();
  private selectedTemperature: Signal<number> = this.modelService.getSelectedTemperature();
  private selectedPrompt: Signal<string> = this.promptService.getSelectedPrompt();
  // private currentConversation: WritableSignal<Conversation> = signal(this.createConversation());
  private currentConversationId: WritableSignal<string> = signal('');
  private conversations: WritableSignal<Conversation[]> = signal([]);

  private _conversationsResource = resource({
    loader: () => this.getAllConversations()
  })

  get conversationsResource() {
    return this._conversationsResource.asReadonly()
  }

  
  constructor(
    private authService: AuthService,
    private modelService: ModelService,
    private promptService: PromptService,
    private http: HttpClient
  ) {
    effect(() => {
      if(this.currentConversationId() !== '') {
        window.history.pushState(null, '', `c/${this.currentConversationId()}`);
      }
    })
  }

  // getCurrentConversation(): WritableSignal<Conversation> {
  //   return this.currentConversation;
  // }

  // async setCurrentConversation(conversation: Conversation) {
  //   this.currentConversation.set(conversation);
  // }

  setCurrentConversationId(id: string) {
    this.currentConversationId.set(id);
  }

  getCurrentConversationId() {
    return this.currentConversationId;
  }

  getConversations(): WritableSignal<Conversation[]> {
    return this.conversations;
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
