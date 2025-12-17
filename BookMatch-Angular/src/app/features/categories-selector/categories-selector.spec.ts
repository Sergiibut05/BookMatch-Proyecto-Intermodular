import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriesSelector } from './categories-selector';

describe('CategoriesSelector', () => {
  let component: CategoriesSelector;
  let fixture: ComponentFixture<CategoriesSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriesSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriesSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
