import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';
import { Conversation, Message, Model } from './conversation.model';
import { ConversationService } from './conversation.service';
import { ModelService } from './model.service';
import { v4 as uuidv4 } from 'uuid';
import { CustomInstructionService } from './custom-instruction.service';

class RetriableError extends Error { }
class FatalError extends Error { }

@Injectable({
    providedIn: 'root'
})
export class ChatRequestService {
    private chatLoading: WritableSignal<boolean> = signal(false);
    private conversations: WritableSignal<Conversation[]> = this.conversationService.getConversations();
    private currentConversation: WritableSignal<Conversation> = this.conversationService.getCurrentConversation();
    private currentRequestId = '';
    private responseContent = '';
    // private responseSubscription: Subscription = new Subscription();
    private selectedModel: Signal<Model> = this.modelService.getSelectedModel();
    private selectedTemperature: Signal<number> = this.modelService.getSelectedTemperature();
  
    constructor(private conversationService: ConversationService, private customInstructionService: CustomInstructionService, private modelService: ModelService) { }

    submitChatRequest(message: string, signal: AbortSignal) {
        this.chatLoading.set(true);
        this.updateCurrentConversationWithUserInput(message);
        const requestObject = this.createRequestObject();
        fetchEventSource(`${environment.chatApiUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
            onmessage(msg) {
                console.log(msg);
            },
            onclose() {
                
            },
            onerror(err) {
                if (err instanceof FatalError) {
                    throw err; // rethrow to stop the operation
                } else {
                    // do nothing to automatically retry. You can also
                    // return a specific retry interval here.
                }
            }
        });
    }

    private createRequestObject() {
        const model = this.selectedModel();
        const conversation = this.currentConversation();
        const selectedInstructions = this.customInstructionService.getSelectedCustomInstruction();
        this.currentRequestId = uuidv4();
    
        return {
          messages: [
            {
              role: 'system',
              content: selectedInstructions().content, // Default or user-selected system prompt.
            },
            ...conversation.messages
          ],
          model: model.id,
          temperature: this.selectedTemperature(),
        }
      }

    updateCurrentConversationWithUserInput(userInput: string) {
        const userMessage = this.initUserMessage(userInput);
        const systemMessage = this.initAssistantMessage();
    
        // Check if it's a new conversation.
        if (!this.currentConversation().messages.length) {
    
          this.currentConversation.update((c: Conversation) => {
            return {
              ...c,
              messages: [userMessage]
            }
          });
    
          // Add the new conversation to the list of all conversations.
          this.conversations.update((conversations) => [...conversations, this.currentConversation()]);
    
        } else {
          // This is an existing conversation. Just append the user message.
          this.currentConversation.update((c: Conversation) => {
            return {
              ...c,
              messages: [...c.messages, userMessage, systemMessage]
            }
          });
    
          // Also update the master list of conversations in place.
          this.conversations.update((c: Conversation[]) => {
            return c.map(conversation => 
              conversation.id === this.currentConversation().id 
                ? { ...conversation, messages: [...conversation.messages, userMessage] } 
                : conversation
            )
          })
        }
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