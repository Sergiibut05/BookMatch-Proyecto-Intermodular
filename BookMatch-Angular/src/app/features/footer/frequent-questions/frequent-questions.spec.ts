import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrequentQuestions } from './frequent-questions';

describe('FrequentQuestions', () => {
  let component: FrequentQuestions;
  let fixture: ComponentFixture<FrequentQuestions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrequentQuestions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FrequentQuestions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
