import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ThematicArea {
  title: string;
  description: string;
  icon: string;
  subjects: string[];
  query: string;
}

@Component({
  selector: 'ds-auibar-thematic-areas',
  standalone: true,
  imports: [NgFor, RouterLink],
  templateUrl: './thematic-areas.component.html',
  styleUrls: ['./thematic-areas.component.scss'],
})
export class ThematicAreasComponent {

  readonly themes: ThematicArea[] = [
    {
      title: 'Data Management',
      description: 'Data, statistics and evidence-based decision-making',
      icon: 'fa-database',
      subjects: [
        'Data',
        'Statistics',
        'Data Management',
        'Monitoring and Evaluation',
      ],
      query: '',
    },
    {
      title: 'Education and Capacity Building',
      description: 'Training, learning and institutional capacity development',
      icon: 'fa-graduation-cap',
      subjects: [
        'Veterinary Education Establishments',
        'Community Training',
        'Project Cycle Management Training Handbook',
      ],
      query: '',
    },
    {
      title: "Gender and Women's Empowerment",
      description: 'Gender equality, inclusion and women’s participation',
      icon: 'fa-people-group',
      subjects: [
        'Women',
        'Gender Mainstreaming',
        'Gender equality',
        'Women participation',
      ],
      query: '',
    },
    {
      title: 'Knowledge Management, Communications and Visibility',
      description: 'Knowledge sharing, communication and institutional visibility',
      icon: 'fa-book-open-reader',
      subjects: [
        'Knowledge Management',
        'Communications',
        'Visibility',
      ],
      query: '',
    },
    {
      title: 'Private Sector',
      description: 'Trade, enterprise, investment and market development',
      icon: 'fa-briefcase',
      subjects: [
        'Fish trade',
        'Agribusiness',
        'Business Models',
        'Investment',
      ],
      query: '',
    },
    {
      title: 'Water Sustainability',
      description: 'Fisheries, aquaculture and sustainable aquatic resources',
      icon: 'fa-water',
      subjects: [
        'Aquaculture',
        'Fisheries',
        'Blue Economy',
        'Aquatic Biodiversity',
      ],
      query: '',
    },
  ].map(theme => ({
    ...theme,
    query: theme.subjects
      .map(subject => `dc.subject:"${subject}"`)
      .join(' OR '),
  }));
}
