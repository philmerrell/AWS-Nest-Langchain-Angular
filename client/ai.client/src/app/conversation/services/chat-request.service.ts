import { Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
                // if the server emits an error message, throw an exception
                // so it gets handled by the onerror callback below:
                if (msg.event === 'FatalError') {
                    throw new FatalError(msg.data);
                }
                console.log(msg.data);
            },
            onclose() {
                // if the server closes the connection unexpectedly, retry:
                throw new RetriableError();
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
}