import { Injectable, Signal, signal } from '@angular/core';
import { DEFAULT_SYSTEM_PROMPT } from './prompts';

@Injectable({
  providedIn: 'root'
})
export class PromptService {
  selectedPrompt: Signal<string> = signal(DEFAULT_SYSTEM_PROMPT)
  constructor() { }

  getSelectedPrompt(): Signal<string> {
    return this.selectedPrompt;
  }
}
