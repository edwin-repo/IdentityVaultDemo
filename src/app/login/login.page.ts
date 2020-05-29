import { AuthenticationService } from './../services/authentication.service';
import { IdentityService } from './../services/IdentityService.service';
import { Component, OnInit } from '@angular/core';
import { User } from '../models/user';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
 email: string;
 pass: string;
  constructor(private identity: IdentityService, private auth: AuthenticationService) { }

  async ngOnInit() {
    if(await this.identity.hasStoredSession()) {
      this.identity.unlockSession();
    }
  }
  
  login() {
    const mockUser: User = { id: 1, firstName: 'sample' , lastName: this.pass, email: this.email };
    const token = 'MTE0NTU1MA|MDU4ODdmNmQzZGViNWY2YmFkNzY1ZGYxY2Y4MGI5MTkxNWIyZDAwMWZjNWJlZjU1MmJmYmYwYThhMTkwNGZhYQ|p5yea__XtawbwKxHy4dDwtqkqh4';
    this.auth.login(mockUser, token);
  }
}
