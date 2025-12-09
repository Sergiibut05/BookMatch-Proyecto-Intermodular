import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundPolicy } from './refund-policy';

describe('RefundPolicy', () => {
  let component: RefundPolicy;
  let fixture: ComponentFixture<RefundPolicy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefundPolicy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefundPolicy);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
