import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpvoteButtonComponent } from './upvote-button.component';

describe('UpvoteButtonComponent', () => {
  let component: UpvoteButtonComponent;
  let fixture: ComponentFixture<UpvoteButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpvoteButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpvoteButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

