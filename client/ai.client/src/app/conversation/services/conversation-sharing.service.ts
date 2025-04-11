// client/ai.client/src/app/conversation/services/conversation-sharing.service.ts
import { Injectable, resource, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Message } from './conversation.model';

export interface ShareConversationOptions {
  conversationId: string;
  shareWithEmails?: string[];
  isPublic?: boolean;
  expiresAt?: string;
}

export interface UpdateSharedConversationOptions {
  shareWithEmails?: string[];
  isPublic?: boolean;
  expiresAt?: string;
}

export interface SharedConversation {
  PK: string;
  title: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  originalConversationId: string;
  shareWithEmails: string[];
  isPublic: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
}

export interface SharedMessage {
  PK: string;
  SK: string;
  content: string;
  role: 'system' | 'user' | 'assistant';
  reasoning?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConversationSharingService {
  // private _sharedConversationsResource = resource({
  //   loader: () => this.getSharedConversationsForUser(),
  // });

  // get sharedConversations() {
  //   return this._sharedConversationsResource.asReadonly();
  // }

  constructor(private http: HttpClient) {}

  async shareConversation(options: ShareConversationOptions): Promise<{ sharedConversationId: string }> {
    const url = `${environment.chatApiUrl}/conversations/share`;
    return lastValueFrom(this.http.post<{ sharedConversationId: string }>(url, options));
  }

  async getSharedConversation(sharedConversationId: string): Promise<SharedConversation> {
    const url = `${environment.chatApiUrl}/conversations/shared/${sharedConversationId}`;
    return lastValueFrom(this.http.get<SharedConversation>(url));
  }

  async getSharedConversationMessages(sharedConversationId: string): Promise<Message[]> {
    const url = `${environment.chatApiUrl}/conversations/shared/${sharedConversationId}/messages`;
    return lastValueFrom(this.http.get<Message[]>(url));
  }

  async getShareableLink(sharedConversationId: string): Promise<string> {
    const url = `${environment.chatApiUrl}/conversations/shared/${sharedConversationId}/link`;
    const response = await lastValueFrom(this.http.post<{ link: string }>(url, {}));
    return response.link;
  }

  async importSharedConversation(sharedConversationId: string): Promise<string> {
    const url = `${environment.chatApiUrl}/conversations/shared/${sharedConversationId}/import`;
    const response = await lastValueFrom(this.http.post<{conversationId: string}>(url, {}));
    return response.conversationId;
  }

  async getSharedConversationsForUser(): Promise<SharedConversation[]> {
    const url = `${environment.chatApiUrl}/conversations/shared/my`;
    return lastValueFrom(this.http.get<SharedConversation[]>(url));
  }

  async updateSharedConversation(
    sharedConversationId: string, 
    options: UpdateSharedConversationOptions
  ): Promise<SharedConversation> {
    const url = `${environment.chatApiUrl}/conversations/shared/${sharedConversationId}`;
    return lastValueFrom(this.http.patch<SharedConversation>(url, options));
  }

  async deleteSharedConversation(sharedConversationId: string): Promise<void> {
    const url = `${environment.chatApiUrl}/conversations/shared/${sharedConversationId}`;
    await lastValueFrom(this.http.delete(url));
  }

  // refreshSharedConversations() {
  //   this._sharedConversationsResource.reload();
  // }
}