import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConversationTextComponent } from './conversation-text.component';

describe('ConversationTextComponent', () => {
  let component: ConversationTextComponent;
  let fixture: ComponentFixture<ConversationTextComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ConversationTextComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConversationTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
