import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ds-auibar-document-types',
  standalone: true,
  imports: [NgFor, RouterLink],
  templateUrl: './document-types.component.html',
  styleUrls: ['./document-types.component.scss'],
})
export class DocumentTypesComponent {
  readonly types = [
    {
      title: 'Policy Briefs',
      description: 'Evidence for policy and decision-making',
      icon: 'fa-scale-balanced',
      query: '"policy brief"',
    },
    {
      title: 'Technical Reports',
      description: 'Assessments, findings and technical outputs',
      icon: 'fa-chart-line',
      query: '"technical report"',
    },
    {
      title: 'Guidelines & Frameworks',
      description: 'Practical guidance and institutional frameworks',
      icon: 'fa-list-check',
      query: 'guidelines OR framework',
    },
    {
      title: 'Training Materials',
      description: 'Learning resources and capacity development',
      icon: 'fa-graduation-cap',
      query: 'training OR workshop',
    },
    {
      title: 'Research & Studies',
      description: 'Research, analysis and evidence',
      icon: 'fa-microscope',
      query: 'research OR study',
    },
    {
      title: 'Multimedia',
      description: 'Videos, presentations and event resources',
      icon: 'fa-photo-film',
      query: 'video OR presentation',
    },
  ];
}
