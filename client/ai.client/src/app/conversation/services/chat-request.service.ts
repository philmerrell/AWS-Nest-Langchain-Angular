import { Injectable, Resource, Signal, signal, WritableSignal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { EventSourceMessage, EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';
import { Conversation, Message, Model } from './conversation.model';
import { ConversationService } from './conversation.service';
import { ModelService } from './model.service';
import { v4 as uuidv4 } from 'uuid';
import { CustomInstructionService } from './custom-instruction.service';
import { AuthService } from 'src/app/auth/auth.service';

class RetriableError extends Error { }
class FatalError extends Error { }

@Injectable({
  providedIn: 'root'
})
export class ChatRequestService {
  private activeResponses = new Map<string, {
    content: string;
    inputTokens: number;
    outputTokens: number;
  }>();
  
  // Add a new signal for the assistant's response
  private assistantResponseContent: WritableSignal<string> = signal('');
  private chatLoading: WritableSignal<boolean> = signal(false);
  private conversations: Resource<Conversation[] | undefined> = this.conversationService.conversationsResource;
  private currentConversation: WritableSignal<Conversation> = this.conversationService.getCurrentConversation();
  private currentRequestId = '';
  private responseContent = '';
  private selectedModel: Signal<Model> = this.modelService.getSelectedModel();
  // private selectedTemperature: Signal<number> = this.modelService.getSelectedTemperature();

  constructor(private authService: AuthService, private conversationService: ConversationService, private customInstructionService: CustomInstructionService, private modelService: ModelService) { }

  submitChatRequest(userInput: string, signal: AbortSignal) {
    this.chatLoading.set(true);
    const currentConversation = this.conversationService.getCurrentConversation();
    const userMessage = this.createUserMessage(userInput, currentConversation());
    const model = this.selectedModel();


    fetchEventSource(`${environment.chatApiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authService.getToken()}`
      },
      body: JSON.stringify({ ...userMessage, modelId: model.id }),
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

  private parseMessage(msg: EventSourceMessage) {
    try {
      
      const message = JSON.parse(msg.data);
      console.log(message);
      
      // Handle different message types
      if ('conversationId' in message) {
        // This is a new conversation ID message`
        this.handleNewConversation(message.conversationId);
      } else if ('conversationName' in message) {
        console.log('conversationName')
        // Find the conversation where conversationId matches message.conversationId
        console.log(message);
        this.conversationService.updateConversationName(message.conversationId, message.conversationName)
      } else if ('content' in message) {
        // This is a delta update (content chunk)
        this.handleContentDelta(message.content);
      } else if ('inputTokens' in message && 'outputTokens' in message) {
        // This is a token usage message
        this.handleTokenUsage(message.inputTokens, message.outputTokens);
      }
    } catch (error) {
      console.error('Error parsing response:', error);
    }
  }
  
  private handleNewConversation(conversationId: string) {
    this.conversationService.setCurrentConversationId(conversationId);
    this.conversationService.updatePendingConversationId(conversationId);    
  }
  
  private handleContentDelta(content: string) {
    // Update the assistant response content
    this.responseContent += content;
    this.assistantResponseContent.set(this.responseContent);
  }
  
  private handleTokenUsage(inputTokens: number, outputTokens: number) {
    // Store the token usage
    this.activeResponses.set(this.currentRequestId, {
      content: this.responseContent,
      inputTokens,
      outputTokens
    });
  }
  
  private finishCurrentResponse() {
    console.log('finished')
    // Get the completed response
    const response = this.activeResponses.get(this.currentRequestId);
    
    if (!response) return;
    
    // Create the assistant message
    const assistantMessage: Message = {
      role: 'assistant',
      content: response.content
    };
    
    // Update the conversation with the assistant message
    this.currentConversation.update((conversation) => ({
      ...conversation,
      messages: [...(conversation.messages || []), assistantMessage]
    }));

    
    // this.conversationService.addConversation()
    // // Also update the master list of conversations
    // this.conversations
    // this.conversations.value.update((conversations) => 
    //   conversations.map(conversation => 
    //     conversation.conversationId === this.currentConversation().conversationId
    //       ? { ...conversation, messages: [...(conversation.messages || []), assistantMessage] }
    //       : conversation
    //   )
    // );
    
    // Reset state for the next response
    this.responseContent = '';
    this.assistantResponseContent.set('');
    this.chatLoading.set(false);
    this.activeResponses.delete(this.currentRequestId);
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

  private initUserMessage(content: string = ''): Message {
    return {
      content,
      id: uuidv4(),
      role: 'user'
    }
  }

  private initAssistantMessage(): Message {
    return {
      content: '',
      id: uuidv4(),
      role: 'assistant'
    }
  }
}