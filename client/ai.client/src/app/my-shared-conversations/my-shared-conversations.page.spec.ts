import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MySharedConversationsPage } from './my-shared-conversations.page';

describe('MySharedConversationsPage', () => {
  let component: MySharedConversationsPage;
  let fixture: ComponentFixture<MySharedConversationsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MySharedConversationsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
