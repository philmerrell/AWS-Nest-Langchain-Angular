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
            this.getMessagesByConversationId(conversationId).then(fetchedMessages => {
                newSignal.set(fetchedMessages);
            });
            return newSignal;
        }
    }

    private getMessagesByConversationId(conversationId: string): Promise<Message[]> {
        const request = this.http.get<Message[]>(`${environment.chatApiUrl}/messages/${conversationId}`);
        return lastValueFrom(request);
    }

    /**
     * Adds a single message to a conversation in the messageMap
     * Creates the conversation entry if it doesn't exist
     */
    addMessageToConversation(conversationId: string, message: Message): void {
        this.messageMap.update(currentMap => {
        const updatedMap = { ...currentMap };
        if (!updatedMap[conversationId]) {
            updatedMap[conversationId] = signal([]);
        }
        updatedMap[conversationId].update(messages => [...messages, message]);
        return updatedMap;
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
                    messages.map(message => 
                        message.id === messageId ? { ...message, ...updatedAttributes } : message
                    )
                );
            }
            return updatedMap;
        });
    }



}