import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { EventSourceMessage, EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';
import { Conversation, Model } from './conversation.model';
import { ConversationService } from './conversation.service';
import { ModelService } from './model.service';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from 'src/app/auth/auth.service';
import { MessageMapService } from './message-map.service';
import { ModalController, ToastController } from '@ionic/angular/standalone';
import { ModelSettingsComponent } from '../components/model-settings/model-settings.component';
import { HttpClient } from '@angular/common/http';
import { ContentBlock, ToolResult } from './conversation.model';


class RetriableError extends Error { }
class FatalError extends Error { }

@Injectable({
  providedIn: 'root'
})
export class ChatRequestService {
  private chatLoading: WritableSignal<boolean> = signal(false);
  private requestId = '';
  private responseContent = '';
  private reasoningContent = '';
  private selectedModel: Signal<Model | null> = this.modelService.getSelectedModel();
  private abortController = new AbortController();

  constructor(private authService: AuthService,
    private conversationService: ConversationService,
    private http: HttpClient,
    private messageMapService: MessageMapService,
    private modalController: ModalController,
    private modelService: ModelService,
    private toastController: ToastController) { }

    submitChatRequest(userInput: string) {
      this.abortController = new AbortController();
      this.chatLoading.set(true);
      this.requestId = uuidv4();
      const currentConversation = this.conversationService.getCurrentConversation();
      if (currentConversation().conversationId === 'pending') {
        this.conversationService.addConversation(currentConversation());
      }
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
        body: JSON.stringify({ ...userMessage, modelId: model!.modelId, requestId: this.requestId}),
        signal: this.abortController.signal,
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
                content: [{ text: `⚠️ ${err.message}`}]
              }
            );
          }
          this.chatLoading.set(false);
          throw err;
        }
      });
    }

    cancelChatRequest() {
      if (this.abortController) {
        // First abort the client-side request
        this.abortController.abort();
        this.abortController = new AbortController();
        
        // Then notify the server to stop processing
        if (this.requestId) {
          this.http.post(`${environment.chatApiUrl}/chat/cancel/${this.requestId}`, {}).subscribe();
          this.requestId = '';
        }
        
        this.finishCurrentResponse();
        this.chatLoading.set(false);
      }
    }

    private handleAssistantResponse(contentBlock: ContentBlock) {
      const currentConversation = this.conversationService.getCurrentConversation();
      
      const existingMessages = this.messageMapService.getMessagesForConversation(currentConversation().conversationId);
      const assistantMessage = existingMessages().find(m => 
        m.role === 'assistant' && m.id === this.requestId
      );
      
      if (assistantMessage) {
        // Update existing message
        const updatedContent = Array.isArray(assistantMessage.content) 
          ? [...assistantMessage.content, contentBlock]
          : [{ text: assistantMessage.content as unknown as string }, contentBlock];
          
        this.messageMapService.updateMessage(currentConversation().conversationId, this.requestId, {
          ...assistantMessage,
          content: updatedContent
        });
      } else {
        // Add new message
        this.messageMapService.addMessageToConversation(currentConversation().conversationId, {
          id: this.requestId,
          role: 'assistant',
          content: [contentBlock],
          reasoning: this.reasoningContent.length > 0 ? this.reasoningContent : undefined,
          toolResults: []
        });
      }
    }

    private handleToolResult(toolResult: ToolResult) {
      const currentConversation = this.conversationService.getCurrentConversation();
      
      const existingMessages = this.messageMapService.getMessagesForConversation(currentConversation().conversationId);
      const assistantMessage = existingMessages().find(m => 
        m.role === 'assistant' && m.id === this.requestId
      );
      
      if (assistantMessage) {
        const toolResults = assistantMessage.toolResults || [];
        const updatedToolResults = [...toolResults, toolResult];
        
        // Update existing message with tool result
        this.messageMapService.updateMessage(currentConversation().conversationId, this.requestId, {
          ...assistantMessage,
          toolResults: updatedToolResults
        });
      }
    }
    
    private handleUsageMetadata(usage: any) {
      const currentConversation = this.conversationService.getCurrentConversation();
      
      const existingMessages = this.messageMapService.getMessagesForConversation(currentConversation().conversationId);
      const assistantMessage = existingMessages().find(m => 
        m.role === 'assistant' && m.id === this.requestId
      );
      
      if (assistantMessage) {
        // Update existing message with usage data
        this.messageMapService.updateMessage(currentConversation().conversationId, this.requestId, {
          ...assistantMessage,
          usage
        });
      }
    }

    private updateAssistantResponseWithReasoning() {
      const currentConversation = this.conversationService.getCurrentConversation();
      const existingMessages = this.messageMapService.getMessagesForConversation(currentConversation().conversationId);
      const assistantMessage = existingMessages().find(m => 
        m.role === 'assistant' && m.id === this.requestId
      );
      
      if (assistantMessage) {
        // Update existing message with reasoning
        this.messageMapService.updateMessage(currentConversation().conversationId, this.requestId, {
          ...assistantMessage,
          content: [{ text: this.responseContent }],
          reasoning: this.reasoningContent
        });
      } else {
        // Add new message with reasoning
        this.messageMapService.addMessageToConversation(currentConversation().conversationId, {
          id: this.requestId,
          role: 'assistant',
          content: [{text: this.responseContent}],
          reasoning: this.reasoningContent
        });
      }
    }

    private parseMessage(msg: EventSourceMessage) {
      try {
        const message = JSON.parse(msg.data);
        switch(msg.event) {
          case 'delta':
            if ('content' in message) {
              // Handle text content delta
              const textBlock: ContentBlock = { text: message.content };
              this.handleAssistantResponse(textBlock);
            }
            break;
          case 'reasoning':
            this.handleReasoningContent(message.reasoning);
            this.updateAssistantResponseWithReasoning();
            break;
          case 'tool_use':
            // Handle tool use events
            const toolUseBlock: ContentBlock = { 
              toolUse: {
                toolUseId: message.toolUseId,
                name: message.name,
                input: message.input
              } 
            };
            this.handleAssistantResponse(toolUseBlock);
            break;
          case 'tool':
            // Handle when a tool is being called
            this.handleToolRequest(message.toolName, message.toolInput);
            break;
          case 'toolResult':
            // Handle tool result events
            const toolResult: ToolResult = {
              toolUseId: uuidv4(), // Generate ID if not provided
              name: message.toolName,
              input: message.toolInput,
              result: message.result,
              status: message.status || 'success'
            };
            this.handleToolResult(toolResult);
            break;
          case 'fullReasoning':
            // When we get the complete reasoning
            this.reasoningContent = message.reasoning;
            this.updateAssistantResponseWithReasoning();
            break;
          case 'metadata':
            if ('conversationId' in message) {
              // Handle new conversation ID
              this.handleNewConversation(message.conversationId);
            }
            if ('conversationId' in message && 'conversationName' in message) {
              this.handleConversationName(message.conversationName, message.conversationId);
            }
            if ('usage' in message) {
              this.handleUsageMetadata(message.usage);
            }
            break;
          case 'error':
            const errorMessage = message.error || 'An error occurred';
            this.showErrorToast(errorMessage);
            
            // If it's a model access error, redirect to model selection
            if (errorMessage.includes('do not have access to the selected model')) {
              this.openModelSelectionModal();
            }
            break;
          default:
            if (message === '[DONE]') {
              this.chatLoading.set(false);
            }
        }
      } catch (error) {
        console.error('Error parsing response:', error);
      }
    }
    
    // Add new method to handle tool requests
    private handleToolRequest(toolName: string, input: any) {
      const currentConversation = this.conversationService.getCurrentConversation();
      
      const existingMessages = this.messageMapService.getMessagesForConversation(currentConversation().conversationId);
      const assistantMessage = existingMessages().find(m => 
        m.role === 'assistant' && m.id === this.requestId
      );
      
      if (assistantMessage) {
        // Update the message to show the tool is being used
        this.messageMapService.updateMessage(currentConversation().conversationId, this.requestId, {
          ...assistantMessage,
          // Add a special metadata property to track tool status
          toolStatus: {
            inProgress: true,
            name: toolName,
            input: input
          }
        });
      }
    }
    
    // Update showErrorToast method
    private async showErrorToast(errorMessage: string) {
      const toast = await this.toastController.create({
        message: errorMessage,
        color: 'danger',
        duration: 3000,
        buttons: ['Ok']
      });
      toast.present();
    }

  private async openModelSelectionModal() {
    const modal = await this.modalController.create({
      component: ModelSettingsComponent,
      componentProps: {
        showAccessError: true
      }
    });
    modal.present();
  }

  private handleReasoningContent(reasoningContent: string) {
    this.reasoningContent = this.reasoningContent += reasoningContent
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

  private handleNewUserMessage(message: any, conversation: WritableSignal<Conversation>) {
    this.messageMapService.addMessageToConversation(conversation().conversationId, message);
  }
  
  private finishCurrentResponse() {
    this.reasoningContent = '';
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