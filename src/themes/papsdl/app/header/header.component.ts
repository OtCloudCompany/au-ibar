import {
  AsyncPipe,
  NgIf,
} from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { HeaderComponent as BaseComponent } from '../../../../app/header/header.component';
import { ContextHelpToggleComponent } from '../../../../app/header/context-help-toggle/context-help-toggle.component';
import { ThemedAuthNavMenuComponent } from '../../../../app/shared/auth-nav-menu/themed-auth-nav-menu.component';
import { ImpersonateNavbarComponent } from '../../../../app/shared/impersonate-navbar/impersonate-navbar.component';
import { ThemedLangSwitchComponent } from '../../../../app/shared/lang-switch/themed-lang-switch.component';
import { ThemedSearchFormComponent } from '../../../../app/shared/search-form/themed-search-form.component';

@Component({
  selector: 'ds-themed-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
    RouterLink,
    NgbDropdownModule,
    TranslateModule,
    ContextHelpToggleComponent,
    ThemedLangSwitchComponent,
    ThemedAuthNavMenuComponent,
    ImpersonateNavbarComponent,
    ThemedSearchFormComponent,
  ],
})
export class HeaderComponent extends BaseComponent {
}
