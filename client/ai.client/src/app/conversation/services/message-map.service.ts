import { Injectable, Signal, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Message } from './conversation.model';
import { environment } from 'src/environments/environment';
import { Observable, catchError, lastValueFrom, map, of, tap } from 'rxjs';

interface MessageMap {
    [conversationId: string]: Message[];
}

@Injectable({
    providedIn: 'root'
})
export class MessageMapService {
    private messageMap = signal<MessageMap>({});
    private apiUrl = `${environment.chatApiUrl}/messages`;

    constructor(private http: HttpClient) { }

    async getMessages(conversationId: string): Promise<Signal<Message[]>> {
        const messages = this.messageMap()[conversationId];
        if (messages) {
            return signal(messages)
        } else {
            const messages = await this.getMessagesByConversationId(conversationId);
            this.messageMap.update((map) => ({
                ...map,
                [conversationId]: messages
            }));
            return signal(messages);
        }
    }

    private getMessagesByConversationId(conversationId: string): Promise<Message[]> {
        const request = this.http.get<Message[]>(`${environment.chatApiUrl}/messages/${conversationId}`);
        return lastValueFrom(request);
      }

}