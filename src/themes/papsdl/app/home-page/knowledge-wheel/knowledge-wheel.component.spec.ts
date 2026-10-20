import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KnowledgeWheelComponent } from './knowledge-wheel.component';

describe('KnowledgeWheelComponent', () => {
  let component: KnowledgeWheelComponent;
  let fixture: ComponentFixture<KnowledgeWheelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KnowledgeWheelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(KnowledgeWheelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
