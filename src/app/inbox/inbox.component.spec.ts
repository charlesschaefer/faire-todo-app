import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InboxComponent } from './inbox.component';

describe('InboxComponent', () => {
  let component: InboxComponent;
  let fixture: ComponentFixture<InboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InboxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
