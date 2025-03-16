import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AdvancedSettingsComponent } from './advanced-settings.component';

describe('AdvancedSettingsComponent', () => {
  let component: AdvancedSettingsComponent;
  let fixture: ComponentFixture<AdvancedSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AdvancedSettingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdvancedSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
