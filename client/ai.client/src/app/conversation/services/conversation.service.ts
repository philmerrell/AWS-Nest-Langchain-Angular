import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Model } from './conversation.model';
import { ModelService } from './model.service';
import { PromptService } from './prompt.service';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {  
  private selectedModel: Signal<Model> = this.modelService.getSelectedModel();
  private selectedTemperature: Signal<number> = this.modelService.getSelectedTemperature();
  private selectedPrompt: Signal<string> = this.promptService.getSelectedPrompt();
  private currentConversation: WritableSignal<Conversation> = signal(this.createConversation());
  private conversations: WritableSignal<Conversation[]> = signal([]);
  
  constructor(
    private modelService: ModelService,
    private promptService: PromptService,
    
  ) {
  }

  getCurrentConversation(): WritableSignal<Conversation> {
    return this.currentConversation;
  }

  async setCurrentConversation(conversation: Conversation) {
    this.currentConversation.set(conversation);
  }

  getConversations(): WritableSignal<Conversation[]> {
    return this.conversations;
  }

  createConversation(): Conversation {
    const newConversation = {
      id: uuidv4(),
      name: 'New Conversation',
      messages: [],
      model: this.selectedModel(),
      prompt: this.selectedPrompt(),
      temperature: this.selectedTemperature()
    };
    return newConversation;
  }

  setConversations(conversations: Conversation[]) {
    this.conversations.set(conversations);
  }
}
