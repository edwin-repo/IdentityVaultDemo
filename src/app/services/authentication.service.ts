import { Injectable } from '@angular/core';
import { IdentityService } from './IdentityService.service';
import { User } from '../models/user';


@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  constructor(private identity: IdentityService) {}

  async login(user: User, token: string) {
    await this.identity.set(user, token);
  }

  logout() {
    this.identity.remove();
  }

}
