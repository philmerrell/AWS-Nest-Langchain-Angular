import { Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { Model } from './conversation.model';


@Injectable({
  providedIn: 'root'
})
export class ModelService {
  defaultModel = 'anthropic.claude-3-5-sonnet-20240620-v1:0';
  selectedModel: WritableSignal<Model> = signal(this.getModels()[0]);
  selectedTemperature: WritableSignal<number> = signal(0.5);
  constructor() { }

  getModels(): Model[] {
    return [
        { id: 'anthropic.claude-3-5-sonnet-20240620-v1:0', name: 'Claude 3.5 Sonnet' }
    ];
  }

  getSelectedModel(): Signal<Model> {
    return this.selectedModel;
  }

  setSelectedModel(model: Model) {
    this.selectedModel.set(model)
  }

  getSelectedTemperature(): Signal<number> {
    return this.selectedTemperature;
  }

  setSelectedTemperature(temperature: number) {
    this.selectedTemperature.set(temperature);
  }
  
}
