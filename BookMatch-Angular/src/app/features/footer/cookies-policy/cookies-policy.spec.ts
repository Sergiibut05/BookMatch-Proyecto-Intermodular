import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CookiesPolicy } from './cookies-policy';

describe('CookiesPolicy', () => {
  let component: CookiesPolicy;
  let fixture: ComponentFixture<CookiesPolicy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CookiesPolicy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CookiesPolicy);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
