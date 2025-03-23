import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
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
  private chatLoading: WritableSignal<boolean> = signal(false);
  private conversations: WritableSignal<Conversation[]> = this.conversationService.getConversations();
  // private currentConversation: WritableSignal<Conversation> = this.conversationService.getCurrentConversation();
  private currentRequestId = '';
  private responseContent = '';
  // private responseSubscription: Subscription = new Subscription();
  private selectedModel: Signal<Model> = this.modelService.getSelectedModel();
  private selectedTemperature: Signal<number> = this.modelService.getSelectedTemperature();

  constructor(private authService: AuthService, private conversationService: ConversationService, private customInstructionService: CustomInstructionService, private modelService: ModelService) { }

  submitChatRequest(message: string, signal: AbortSignal) {
    this.chatLoading.set(true);
    const requestObject = this.createRequestObject(message);

    fetchEventSource(`${environment.chatApiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authService.getToken()}`
      },
      body: JSON.stringify({ ...requestObject }),
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
        this.chatLoading.set(false);
      },
      onerror: (err) => {
        throw err;
      }
    });
  }

  private parseMessage(msg: EventSourceMessage) {
    switch(msg.event) {
      case 'metadata':
        this.setMetadata(msg.data);
        break;
      case 'delta': 
        this.parseMessageDelta(msg.data)
        break;
      default:

        break;
    }
    try {
      // const message = JSON.parse(msg.data);

      // console.log(message);
    } catch (error) {
      console.error('Error parsing response:', error);
    }
    
  }

  setMetadata(data: string) {
    const response = JSON.parse(data);
    console.log(response.conversationId);
    this.conversationService.setCurrentConversationId(response.conversationId)
  }

  private parseMessageDelta(message: string) {
    try {
      const response = JSON.parse(message);
      console.log(response);
    } catch(error) {

    }
  }

  private createRequestObject(content: string) {
    const model = this.selectedModel();

    return {
      role: 'user',
      content,
      modelId: model.id
    }
  }

  updateCurrentConversationWithUserInput(userInput: string) {
    // const userMessage = this.initUserMessage(userInput);
    // const assistantMessage = this.initAssistantMessage();

    // // Check if it's a new conversation.
    // if (!this.currentConversation().messages.length) {

    //   this.currentConversation.update((c: Conversation) => {
    //     return {
    //       ...c,
    //       messages: [userMessage]
    //     }
    //   });

    //   // Add the new conversation to the list of all conversations.
    //   this.conversations.update((conversations) => [...conversations, this.currentConversation()]);

    // } else {
    //   // This is an existing conversation. Just append the user message.
    //   this.currentConversation.update((c: Conversation) => {
    //     return {
    //       ...c,
    //       messages: [...c.messages, userMessage]
    //     }
    //   });

    //   // Also update the master list of conversations in place.
    //   this.conversations.update((c: Conversation[]) => {
    //     return c.map(conversation =>
    //       conversation.id === this.currentConversation().id
    //         ? { ...conversation, messages: [...conversation.messages, userMessage] }
    //         : conversation
    //     )
    //   })
    // }
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