import { Component } from '@angular/core';
import {TranslateModule} from "@ngx-translate/core";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'ds-custom-sidebar',
  standalone: true,
  imports: [
    TranslateModule,
    RouterLink
  ],
  templateUrl: './custom-sidebar.component.html',
  styleUrl: './custom-sidebar.component.scss'
})
export class CustomSidebarComponent {

}
