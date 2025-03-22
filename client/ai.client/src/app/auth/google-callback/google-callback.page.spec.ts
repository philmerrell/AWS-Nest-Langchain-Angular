import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoogleCallbackPage } from './google-callback.page';

describe('GoogleCallbackPage', () => {
  let component: GoogleCallbackPage;
  let fixture: ComponentFixture<GoogleCallbackPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GoogleCallbackPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
