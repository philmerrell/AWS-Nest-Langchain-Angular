import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedConversationPage } from './shared-conversation.page';

describe('SharedConversationPage', () => {
  let component: SharedConversationPage;
  let fixture: ComponentFixture<SharedConversationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SharedConversationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
