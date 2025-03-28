// client/ai.client/src/app/conversation/services/conversation-sharing.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { resource } from '@angular/core';

export interface ShareConversationOptions {
  conversationId: string;
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
  private _sharedConversationsResource = resource({
    loader: () => this.loadSharedConversations(),
  });

  get sharedConversations() {
    return this._sharedConversationsResource.asReadonly();
  }

  constructor(private http: HttpClient) {}

  async shareConversation(options: ShareConversationOptions): Promise<{ sharedConversationId: string }> {
    const url = `${environment.chatApiUrl}/conversations/share`;
    return lastValueFrom(this.http.post<{ sharedConversationId: string }>(url, options));
  }

  async getSharedConversation(sharedConversationId: string): Promise<SharedConversation> {
    const url = `${environment.chatApiUrl}/conversations/shared/${sharedConversationId}`;
    return lastValueFrom(this.http.get<SharedConversation>(url));
  }

  async getSharedConversationMessages(sharedConversationId: string): Promise<SharedMessage[]> {
    const url = `${environment.chatApiUrl}/conversations/shared/${sharedConversationId}/messages`;
    return lastValueFrom(this.http.get<SharedMessage[]>(url));
  }

  async getShareableLink(sharedConversationId: string): Promise<string> {
    const url = `${environment.chatApiUrl}/conversations/shared/${sharedConversationId}/link`;
    const response = await lastValueFrom(this.http.post<{ link: string }>(url, {}));
    return response.link;
  }

  private async loadSharedConversations(): Promise<SharedConversation[]> {
    const url = `${environment.chatApiUrl}/conversations/shared`;
    return lastValueFrom(this.http.get<SharedConversation[]>(url));
  }

  refreshSharedConversations() {
    this._sharedConversationsResource.reload();
  }
}