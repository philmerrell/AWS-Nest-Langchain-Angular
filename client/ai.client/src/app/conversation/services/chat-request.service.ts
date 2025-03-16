import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';
class RetriableError extends Error { }
class FatalError extends Error { }

@Injectable({
    providedIn: 'root'
})
export class ChatRequestService {
    private chatLoading: WritableSignal<boolean> = signal(false);

    constructor() { }

    submitChatRequest(message: string, signal: AbortSignal) {
        this.chatLoading.set(true);
        fetchEventSource(`${environment.chatApiUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                foo: 'bar'
            }),
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

    getChatLoading(): Signal<boolean> {
        return this.chatLoading;
    }
}