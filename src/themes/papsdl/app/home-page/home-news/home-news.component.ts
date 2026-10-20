import { NgClass } from '@angular/common';
import {
  Component,
  OnInit,
} from '@angular/core';

import { HomeNewsComponent as BaseComponent } from '../../../../../app/home-page/home-news/home-news.component';
import {ThemedSearchFormComponent} from "../../../../../app/shared/search-form/themed-search-form.component";
import {TranslateModule} from "@ngx-translate/core";

@Component({
  selector: 'ds-themed-home-news',
  styleUrls: ['../../../../../app/home-page/home-news/home-news.component.scss'],
  templateUrl: './home-news.component.html',
  standalone: true,
  imports: [NgClass, ThemedSearchFormComponent, TranslateModule],
})

/**
 * Component to render the news section on the home page
 */
export class HomeNewsComponent extends BaseComponent implements OnInit{
  randomClass = 'background-image background-image-1';
  ngOnInit() {
    const image_classes = [
      'background-image background-image-1',
      'background-image background-image-2',
      'background-image background-image-3',
      'background-image background-image-4',
      'background-image background-image-5',
      'background-image background-image-6',
      'background-image background-image-7',
      // 'background-image background-image-8',
      'background-image background-image-9',
      'background-image background-image-10',
      'background-image background-image-11',
      'background-image background-image-12',
      'background-image background-image-13',
      'background-image background-image-14',
      'background-image background-image-15',
      'background-image background-image-16',
      'background-image background-image-17',
      'background-image background-image-18',
      'background-image background-image-19',
      'background-image background-image-20',
      'background-image background-image-21',
      'background-image background-image-22',
      'background-image background-image-23',
      'background-image background-image-24',
      'background-image background-image-25',
      'background-image background-image-26',
      'background-image background-image-27',
      'background-image background-image-28',
      'background-image background-image-29',
      'background-image background-image-30',
      'background-image background-image-31',
      'background-image background-image-32',
      'background-image background-image-33',
      'background-image background-image-34',
      'background-image background-image-35',
      'background-image background-image-36',
      'background-image background-image-37',
      'background-image background-image-38',
      'background-image background-image-39',
      'background-image background-image-40',
      'background-image background-image-41',
      'background-image background-image-42',
      'background-image background-image-43',
      'background-image background-image-44',
      'background-image background-image-45',
      'background-image background-image-46',
    ];

    const randomNum = Math.floor(Math.random() * image_classes.length);
    this.randomClass = image_classes[randomNum];

  }
}

