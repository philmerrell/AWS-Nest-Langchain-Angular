import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { CustomInstruction } from './conversation.model';
import { DEFAULT_SYSTEM_PROMPT } from './prompts';

@Injectable({
  providedIn: 'root'
})
export class CustomInstructionService {
  private selectedCustomInstruction: WritableSignal<CustomInstruction> = signal(this.getDefaultInstructions() as CustomInstruction); //
  
  constructor() {
    this.getDefaultInstructions();
  }

  clearInstructions() {
    const instructions = this.getDefaultInstructions();
    this.selectedCustomInstruction.set(instructions);
  }

  setCustomInstructions() {

  }

  getSelectedCustomInstruction(): Signal<CustomInstruction> {
    return this.selectedCustomInstruction;
  }

  setSelectedCustomInstruction(instruction: CustomInstruction) {
    this.selectedCustomInstruction.set(instruction);
  }

  getDefaultInstructions(): CustomInstruction {
    return {
        id: 'default',
        name: 'Default Instructions',
        description: 'Default Instructions',
        content: DEFAULT_SYSTEM_PROMPT
    }
  }

}
