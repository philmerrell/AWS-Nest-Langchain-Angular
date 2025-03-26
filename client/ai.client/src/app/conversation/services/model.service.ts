import { Injectable, resource, signal, Signal, WritableSignal } from '@angular/core';
import { Model } from './conversation.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ModelService {
  defaultModel = 'anthropic.claude-3-5-sonnet-20240620-v1:0';
  selectedModel: WritableSignal<Model> = signal(this.getModels()[0]);
  selectedTemperature: WritableSignal<number> = signal(0.5);
  private _modelsResource = resource({
    loader: () => this.loadModels()
  })

  get models() {
    return this._modelsResource.asReadonly()
  }
  constructor(private http: HttpClient) { }

  getModels(): Model[] {
    return [
        { modelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0', name: 'Claude 3.5 Sonnet' } as Model,
        // { modelId: 'amazon.nova-pro-v1:0', name: 'AWS Nova Pro' },
    ];
  }

  addModel(model: Model) {
    const response = this.http.post(`${environment.chatApiUrl}/models`, model);
    return lastValueFrom(response);
  }

  private loadModels(): Promise<Model[]> {
    const response = this.http.get<Model[]>(`${environment.chatApiUrl}/models`)
    return lastValueFrom(response);
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
