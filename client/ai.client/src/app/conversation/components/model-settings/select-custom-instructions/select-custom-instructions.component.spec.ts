import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SelectCustomInstructionsComponent } from './select-custom-instructions.component';

describe('SelectCustomInstructionsComponent', () => {
  let component: SelectCustomInstructionsComponent;
  let fixture: ComponentFixture<SelectCustomInstructionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SelectCustomInstructionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectCustomInstructionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
