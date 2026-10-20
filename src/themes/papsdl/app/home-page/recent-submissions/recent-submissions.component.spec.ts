import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentSubmissionsComponent } from './recent-submissions.component';

describe('RecentSubmissionsComponent', () => {
  let component: RecentSubmissionsComponent;
  let fixture: ComponentFixture<RecentSubmissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentSubmissionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecentSubmissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
