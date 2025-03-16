import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { IonNav } from '@ionic/angular/standalone';
import { SelectModelComponent } from '../select-model/select-model.component';

@Component({
  selector: 'app-model-settings',
  templateUrl: './model-settings.component.html',
  styleUrls: ['./model-settings.component.scss'],
  standalone: true,
  imports: [IonNav ]
})
export class ModelSettingsComponent  implements OnInit {
  @ViewChild('nav', {read: ElementRef, static: true}) nav!: ElementRef<IonNav>
  constructor() { }

  ngOnInit() {
    this.nav.nativeElement.setRoot(SelectModelComponent, { nav: this.nav.nativeElement })
  }

}
