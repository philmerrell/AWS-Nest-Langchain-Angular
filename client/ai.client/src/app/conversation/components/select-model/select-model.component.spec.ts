import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SelectModelComponent } from './select-model.component';

describe('SelectModelComponent', () => {
  let component: SelectModelComponent;
  let fixture: ComponentFixture<SelectModelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SelectModelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
