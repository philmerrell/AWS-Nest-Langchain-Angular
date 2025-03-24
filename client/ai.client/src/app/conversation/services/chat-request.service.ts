import { Injectable, Resource, Signal, signal, WritableSignal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { EventSourceMessage, EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';
import { Conversation, Message, Model } from './conversation.model';
import { ConversationService } from './conversation.service';
import { ModelService } from './model.service';
import { v4 as uuidv4 } from 'uuid';
import { CustomInstructionService } from './custom-instruction.service';
import { AuthService } from 'src/app/auth/auth.service';
import { MessageMapService } from './message-map.service';

class RetriableError extends Error { }
class FatalError extends Error { }

@Injectable({
  providedIn: 'root'
})
export class ChatRequestService {
  // Add a new signal for the assistant's response
  private assistantResponseContent: WritableSignal<string> = signal('');
  private chatLoading: WritableSignal<boolean> = signal(false);
  // private conversations: Resource<Conversation[] | undefined> = this.conversationService.conversationsResource;
  // private currentConversation: WritableSignal<Conversation> = this.conversationService.getCurrentConversation();
  // private currentRequestId = '';
  private requestId = '';
  private responseContent = '';
  private selectedModel: Signal<Model> = this.modelService.getSelectedModel();
  // private selectedTemperature: Signal<number> = this.modelService.getSelectedTemperature();

  constructor(private authService: AuthService,
    private conversationService: ConversationService,
    private messageMapService: MessageMapService,
    private modelService: ModelService) { }

  submitChatRequest(userInput: string, signal: AbortSignal) {
    this.chatLoading.set(true);
    this.requestId = uuidv4();
    const currentConversation = this.conversationService.getCurrentConversation();
    const userMessage = this.createUserMessage(userInput, currentConversation());
    this.handleNewUserMessage(userMessage, currentConversation);
    
    const model = this.selectedModel();


    fetchEventSource(`${environment.chatApiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authService.getToken()}`
      },
      body: JSON.stringify({ ...userMessage, modelId: model.id, requestId:  this.requestId}),
      signal: signal,
      async onopen(response) {
        if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
          return; // everything's good
        } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          // client-side errors are usually non-retriable:
          throw new FatalError();
        } else {
          throw new RetriableError();
        }
      },
      onmessage: (msg) => {
        this.parseMessage(msg);
      },
      onclose: () => {
        this.finishCurrentResponse();
        this.chatLoading.set(false);
      },
      onerror: (err) => {
        throw err;
      }
    });
  }

  private updateAssistantResponseWithDelta(contentDelta: string) {
    const currentConversation = this.conversationService.getCurrentConversation();
    this.responseContent += contentDelta;
    const existingMessages = this.messageMapService.getMessagesForConversation(currentConversation().conversationId);
    const assistantMessage = existingMessages().find(m => 
      m.role === 'assistant' && m.id === this.requestId
    );
    
    if (assistantMessage) {
      // Update existing message
      this.messageMapService.updateMessage(currentConversation().conversationId, this.requestId, {
        ...assistantMessage,
        content: this.responseContent
      });
    } else {
      // Add new message
      this.messageMapService.addMessageToConversation(currentConversation().conversationId, {
        id: this.requestId,
        role: 'assistant',
        content: this.responseContent
      });
    }
    
  }

  private parseMessage(msg: EventSourceMessage) {
    try {
      const message = JSON.parse(msg.data);
      
      // Handle different message types
      if (message === '[DONE]') {
        this.chatLoading.set(false);
      } else if ('conversationId' in message && 'conversationName' in message) {
        this.handleConversationName(message.conversationName, message.conversationId);
      } else if ('conversationId' in message) {
        // Handle new conversation ID
        this.handleNewConversation(message.conversationId);
      } else if ('content' in message) {
        // Handle content delta
        this.handleContentDelta(message.content);
      } else if ('inputTokens' in message && 'outputTokens' in message) {
        // Handle token usage information
        this.handleTokenUsage(message.inputTokens, message.outputTokens);
      }
    } catch (error) {
      console.error('Error parsing response:', error);
    }
  }

  private handleConversationName(name: string, conversationId: string) {
    this.conversationService.updateConversationName(conversationId, name);
    this.conversationService.updateCurrentConversationName(name)
  }
  
  private handleNewConversation(conversationId: string) {
    this.conversationService.setCurrentConversationId(conversationId);
    this.conversationService.updatePendingConversationId(conversationId);
    this.messageMapService.updatePendingKey(conversationId);
  }
  
  private handleContentDelta(content: string) {
    // Update the assistant response content
    this.updateAssistantResponseWithDelta(content);
  }
  
  private handleTokenUsage(inputTokens: number, outputTokens: number) {
    // Store the token usage
    
  }

  private handleNewUserMessage(message: any, conversation: WritableSignal<Conversation>) {
    this.messageMapService.addMessageToConversation(conversation().conversationId, message);
  }
  
  private finishCurrentResponse() {
    this.responseContent = '';
    this.chatLoading.set(false);
  }

  setMetadata(data: string) {
    const response = JSON.parse(data);
    this.conversationService.setCurrentConversationId(response.conversationId)
  }

  private createUserMessage(content: string, conversation: Conversation) {
    
    const requestObject: any = {
      role: 'user',
      content,
      id: uuidv4()
    };

    if (conversation.conversationId !== 'pending') {
      requestObject.conversationId = conversation.conversationId;
    }

    return requestObject;
  }

  getChatLoading(): Signal<boolean> {
    return this.chatLoading;
  }

}