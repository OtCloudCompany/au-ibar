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
// AU-IBAR (2026-10-24): each card searches the AU-IBAR knowledge product types (dc.type, controlled
// vocabulary auibar-types) instead of free-text keywords.
export class DocumentTypesComponent {
  readonly types = [
    {
      title: 'Policy Briefs',
      description: 'Evidence for policy and decision-making',
      icon: 'fa-scale-balanced',
      query: 'dc.type:("Policy brief" OR "Policy Note" OR "Position paper")',
    },
    {
      title: 'Technical Reports',
      description: 'Assessments, findings and technical outputs',
      icon: 'fa-chart-line',
      query: 'dc.type:("Technical report" OR "Research report" OR "Mission report" OR "Monitoring and evaluation report" OR "Closeout or completion report" OR "Progress and annual reports")',
    },
    {
      title: 'Guidelines & Frameworks',
      description: 'Practical guidance and institutional frameworks',
      icon: 'fa-list-check',
      query: 'dc.type:("Guidelines" OR "Policy framework or strategy" OR "Standards and protocols" OR "Action plan or roadmap" OR "Model legislation" OR "Strategic plan")',
    },
    {
      title: 'Training Materials',
      description: 'Learning resources and capacity development',
      icon: 'fa-graduation-cap',
      query: 'dc.type:("Training manual or handbook" OR "Training module or curriculum" OR "Toolkit" OR "E-learning course" OR "Standard operating procedures")',
    },
    {
      title: 'Research & Studies',
      description: 'Research, analysis and evidence',
      icon: 'fa-microscope',
      query: 'dc.type:("Research report" OR "Journal article" OR "Conference paper" OR "Working or discussion paper" OR "Baseline or feasibility study" OR "Thesis or dissertation" OR "Case study")',
    },
    {
      title: 'Multimedia',
      description: 'Videos, presentations and event resources',
      icon: 'fa-photo-film',
      query: 'dc.type:("Video or documentary" OR "Photographs" OR "Podcast or audio or radio" OR "Presentations" OR "Webinar recordings")',
    },
  ];
}
