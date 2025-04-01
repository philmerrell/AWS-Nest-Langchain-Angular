import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class ThemeService{
  private prefDark = window.matchMedia('(prefers-color-scheme: dark)');
  private _logoSubject = new BehaviorSubject<string>('logo-light.png');
  private _logo$ = this._logoSubject.asObservable();
  private _theme = new BehaviorSubject<ColorMode>(ColorMode.AUTO);
  private _theme$ = this._theme.asObservable();

  get logo$() {
    return this._logo$;
  }

  get theme$() {
    return this._theme$;
  }

  constructor() {
    this.prefDark.addEventListener('change', this.handleMediaListenerChange);
    let savedMode : ColorMode = localStorage.getItem('theme') as ColorMode;
    if(savedMode) {
      this._logoSubject.next(savedMode);
      this._theme.next(savedMode);
      this.changeTheme(savedMode);
    } else {
      localStorage.setItem('theme', ColorMode.AUTO);
      this._logoSubject.next(ColorMode.AUTO);
    }
  }

  public changeTheme(colorTheme: string) {
    switch (colorTheme) {
      case ColorMode.AUTO: {
        this._logoSubject.next(ColorMode.AUTO);
        this._theme.next(ColorMode.AUTO);
        localStorage.setItem('theme', ColorMode.AUTO);
        this.prefDark.addEventListener('change', this.handleMediaListenerChange);
        if (this.prefDark.matches) {
          this.applyDarkMode();
        } else {
          this.applyLightMode();
        }
        break;
      }
      case ColorMode.DARK: {
        this._logoSubject.next(ColorMode.DARK);
        this._theme.next(ColorMode.DARK);
        localStorage.setItem('theme', ColorMode.DARK);
        this.removeMediaListener();
        this.applyDarkMode();
        break;
      }
      case ColorMode.LIGHT: {
        this._logoSubject.next(ColorMode.LIGHT);
        this._theme.next(ColorMode.LIGHT)
        localStorage.setItem('theme', ColorMode.LIGHT);
        this.removeMediaListener();
        this.applyLightMode();
        break;
      }
      default: {
        break;
      }
    }
  }

  private removeMediaListener() {
    this.prefDark.removeEventListener('change', this.handleMediaListenerChange);
  }

  private handleMediaListenerChange = (event: MediaQueryListEvent) => {
    if (event.matches) {
      this.applyDarkMode();
    } else {
      this.applyLightMode();
    }
  };

  private applyLightMode = () => {
    document.body.setAttribute('color-theme', 'Light');
    this._logoSubject.next('logo-light.png');
  };

  private applyDarkMode = () => {
    document.body.setAttribute('color-theme', 'Dark');
    this._logoSubject.next('logo-dark.png');
  };
}

export enum ColorMode {
  AUTO = 'Auto',
  DARK = 'Dark',
  LIGHT = 'Light',
}