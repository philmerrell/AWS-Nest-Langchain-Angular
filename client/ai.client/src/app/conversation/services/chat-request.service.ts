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
import { ToastController } from '@ionic/angular/standalone';

class RetriableError extends Error { }
class FatalError extends Error { }

@Injectable({
  providedIn: 'root'
})
export class ChatRequestService {
  private chatLoading: WritableSignal<boolean> = signal(false);
  private requestId = '';
  private responseContent = '';
  private selectedModel: Signal<Model> = this.modelService.getSelectedModel();

  constructor(private authService: AuthService,
    private conversationService: ConversationService,
    private messageMapService: MessageMapService,
    private modelService: ModelService,
    private toastController: ToastController) { }

    submitChatRequest(userInput: string, signal: AbortSignal) {
      this.chatLoading.set(true);
      this.requestId = uuidv4();
      const currentConversation = this.conversationService.getCurrentConversation();
      const userMessage = this.createUserMessage(userInput, currentConversation());
      this.handleNewUserMessage(userMessage, currentConversation);
      
      const model = this.selectedModel();
    
      // First add error handling for the HTTP request
      fetchEventSource(`${environment.chatApiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authService.getToken()}`
        },
        body: JSON.stringify({ ...userMessage, modelId: model.modelId, requestId: this.requestId}),
        signal: signal,
        async onopen(response) {
          if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
            return; // everything's good
          } else if (response.status === 403) {
            // Handle usage limit exceeded
            const errorData = await response.json();
            // Display error to user
            throw new FatalError(errorData.message);
          } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            // client-side errors are usually non-retriable:
            const errorData = await response.json();
            throw new FatalError(errorData.message || 'Request failed');
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
          // Display error message to user
          if (err instanceof FatalError) {
            // Add the error as a system message
            this.messageMapService.addMessageToConversation(
              currentConversation().conversationId, 
              {
                id: uuidv4(),
                role: 'assistant',
                content: `⚠️ ${err.message}`
              }
            );
          }
          this.chatLoading.set(false);
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

  private async parseMessage(msg: EventSourceMessage) {
    try {
      const message = JSON.parse(msg.data);
      switch(msg.event) {
        case 'delta':
          if ('content' in message) {
            // Handle content delta
            this.handleContentDelta(message.content);
          }
        break;
        case 'metadata':
          if ('conversationId' in message) {
            // Handle new conversation ID
            this.handleNewConversation(message.conversationId);
          }
          if ('conversationId' in message && 'conversationName' in message) {
            this.handleConversationName(message.conversationName, message.conversationId);
          }
        break;
        case 'error':
          const toast = await this.toastController.create({
            message: message.error,
            color: 'danger',
            duration: 0,
            buttons: ['Ok']
          });
          toast.present()
        break;
        default:
          if (message === '[DONE]') {
            this.chatLoading.set(false);
            console.log('Unparsed Message: ',msg);
          }
      }
    }
      catch (error) {
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