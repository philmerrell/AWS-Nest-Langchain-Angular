import { Injectable, Signal, WritableSignal, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Message } from './conversation.model';
import { environment } from 'src/environments/environment';
import { Observable, catchError, lastValueFrom, map, of, tap } from 'rxjs';

interface MessageMap {
    [conversationId: string]: WritableSignal<Message[]>;
}

@Injectable({
    providedIn: 'root'
})
export class MessageMapService {
    private messageMap = signal<MessageMap>({});

    constructor(private http: HttpClient) { }

    getMessagesForConversation(conversationId: string): Signal<Message[]> {
        const messages = this.messageMap()[conversationId];
        if (messages) {
            return messages;
        } else {
            const newSignal = signal<Message[]>([]);
            this.messageMap.update((map) => ({
                ...map,
                [conversationId]: newSignal
            }));
            if(conversationId !== 'pending') {
                this.getMessagesByConversationId(conversationId).then(fetchedMessages => {
                    newSignal.set(fetchedMessages);
                });
            }
            return newSignal;
        }
    }

    private getMessagesByConversationId(conversationId: string): Promise<Message[]> {
        const request = this.http.get<Message[]>(`${environment.chatApiUrl}/messages/${conversationId}`);
        return lastValueFrom(request);
    }

    /**
     * Finds the key with 'pending' and updates it to the provided conversationId
     */
    updatePendingKey(conversationId: string): void {
        this.messageMap.update(currentMap => {
            const updatedMap = { ...currentMap };
            const pendingKey = Object.keys(updatedMap).find(key => key === 'pending');
            if (pendingKey) {
                updatedMap[conversationId] = updatedMap[pendingKey];
                delete updatedMap[pendingKey];
            }
            return updatedMap;
        });
    }

    /**
     * Adds a single message to a conversation in the messageMap
     * Creates the conversation entry if it doesn't exist
     */
    addMessageToConversation(conversationId: string, message: Message): void {
        this.messageMap.update(currentMap => {
          const updatedMap = { ...currentMap };
          
          // Ensure message content is always an array of content blocks
          if (message.content && !Array.isArray(message.content)) {
            // Convert string or any other format to a proper content block array
            if (typeof message.content === 'string') {
              message.content = [{ text: message.content }];
            } else {
              message.content = []; // Default to empty if unrecognized format
            }
          }
          
          if (!updatedMap[conversationId]) {
            updatedMap[conversationId] = signal([message]);
          } else {
            updatedMap[conversationId].update(messages => [...messages, message]);
          }
          
          return { ...updatedMap };
        });
      }

    /**
     * Adds new messages to a conversation in the messageMap
     * Creates the conversation entry if it doesn't exist
     */
    addMessagesToMap(conversationId: string, messages: Message[]): void {
        this.messageMap.update(currentMap => {
            const updatedMap = { ...currentMap };
            updatedMap[conversationId] = signal([...messages]);
            return updatedMap;
        });
    }

    /**
     * Updates a specific message in a conversation
     * If the conversation or message does not exist, no action is taken
     */
    updateMessage(conversationId: string, messageId: string, updatedAttributes: Partial<Message>): void {
        this.messageMap.update(currentMap => {
          const updatedMap = { ...currentMap };
          const conversationMessages = updatedMap[conversationId];
          
          if (conversationMessages) {
            conversationMessages.update(messages => 
              messages.map(message => {
                if (message.id === messageId) {
                  const updatedMessage = { ...message, ...updatedAttributes };
                  
                  // Ensure content is properly formatted as an array of content blocks
                  if (updatedMessage.content && !Array.isArray(updatedMessage.content)) {
                    if (typeof updatedMessage.content === 'string') {
                      updatedMessage.content = [{ text: updatedMessage.content }];
                    } else {
                      // Keep existing content if new content is invalid
                      updatedMessage.content = message.content || [];
                    }
                  }
                  
                  return updatedMessage;
                }
                return message;
              })
            );
          }
          
          return updatedMap;
        });
      }



}