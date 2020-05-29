import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Router } from '@angular/router';
import { IdentityService } from './services/IdentityService.service';
import { DefaultSession } from '@ionic-enterprise/identity-vault';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private router: Router,
    private identity: IdentityService,
  ) {
    this.initializeApp();
    this.identity.changed.subscribe(session => this.handleSessionChange(session));
  }

  async initializeApp() {
    await this.identity.ready();
    this.identity.get();
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      this.router.navigate(['login']);
    });
  }

  private handleSessionChange(session: DefaultSession) {
    if (session) {
      this.router.navigate(['home']);
    } else {
      this.router.navigate(['login']);
    }
  }
}
