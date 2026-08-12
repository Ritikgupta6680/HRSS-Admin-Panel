import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { businessOutline, cubeOutline, logOutOutline } from 'ionicons/icons';

import { AuthService } from './services/auth/auth-service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle,
    IonRouterOutlet,
  ],
})
export class AppComponent {
  private readonly auth = inject(AuthService);

  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly user = this.auth.user;

  readonly menuItems = [
    { title: 'Companies', url: '/home', icon: 'business-outline' },
    { title: 'Packages', url: '/packages', icon: 'cube-outline' },
  ];

  constructor() {
    addIcons({ businessOutline, cubeOutline, logOutOutline });
  }

  logout(): void {
    this.auth.logout();
  }
}
