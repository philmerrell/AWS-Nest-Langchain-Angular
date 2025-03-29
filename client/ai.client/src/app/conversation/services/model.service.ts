// client/ai.client/src/app/conversation/services/model.service.ts
import { Injectable, resource, signal, Signal, WritableSignal } from '@angular/core';
import { Model } from './conversation.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ModelService {
  selectedModel: WritableSignal<Model | null> = signal(null);
  selectedTemperature: WritableSignal<number> = signal(0.5);
  private _modelsResource = resource({
    loader: () => this.loadModels()
  })

  get models() {
    return this._modelsResource.asReadonly()
  }
  constructor(private http: HttpClient) { }

  addModel(model: Model) {
    const response = this.http.post(`${environment.chatApiUrl}/models`, model);
    return lastValueFrom(response);
  }

  private async loadModels(): Promise<Model[]> {
    const response = this.http.get<Model[]>(`${environment.chatApiUrl}/models`);
    const models = await lastValueFrom(response);
    const defaultModel = models.find(model => model.isDefault);
    if (defaultModel) {
      this.setSelectedModel(defaultModel);
    } 
    return models;
  }

  getSelectedModel(): Signal<Model | null> {
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
  
  async setDefaultModel(modelId: string) {
    const response = this.http.put(`${environment.chatApiUrl}/models/${modelId}/default`, {});
    return lastValueFrom(response);
  }
}