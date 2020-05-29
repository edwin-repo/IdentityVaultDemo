import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import {
  AuthMode,
  IonicIdentityVaultUser,
  IonicNativeAuthPlugin,
  DefaultSession,
  VaultConfig,
  VaultError,
  VaultErrorCodes
} from '@ionic-enterprise/identity-vault';
import { Platform } from '@ionic/angular';
import { User } from '../models/user';
import { Subject, Observable, of } from 'rxjs';
import { BrowserAuthPlugin } from './browser-auth/browser-auth.plugin';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class IdentityService extends IonicIdentityVaultUser<DefaultSession> {
  email: string;
  password: string;
  errorMessage: string;

  loginType: string;
  displayVaultLogin: boolean;
  private user: User;
  private _changed: Subject<DefaultSession>;

  constructor(
    private router: Router,
    private plt: Platform,
    private browserAuthPlugin: BrowserAuthPlugin,
    private settings: SettingsService) {
    super(plt, {
      restoreSessionOnReady: false,
      unlockOnReady: false,
      unlockOnAccess: true,
      lockAfter: 5000,
      hideScreenOnBackground: true,
      allowSystemPinFallback: true,
      shouldClearVaultAfterTooManyFailedAttempts: false
    });
    this._changed = new Subject();
  }

  get changed() {
    return this._changed.asObservable();
  }

  get(): Observable<User> {
    if (!this.user) {
      return of({ id: 1, firstName: 'avdiyqa47', lastName: 'avdiyqa47', email: 'a@a.com' });
    } else {
      return of(this.user);
    }
  }

  async set(user: User, token: string): Promise<void> {
    this.user = user;
    const mode = (await this.useBiometrics())
      ? AuthMode.BiometricOnly
      : (await this.settings.usePasscode())
        ? AuthMode.PasscodeOnly
        : (await this.settings.useSecureStorageMode())
          ? AuthMode.SecureStorage
          : AuthMode.InMemoryOnly;
    const session: DefaultSession = { username: user.email, token: token };
    await this.login({ username: user.email, token: token }, mode);
    this._changed.next(session);
  }

  private async useBiometrics(): Promise<boolean> {
    const use = await Promise.all([this.settings.useBiometrics(), this.isBiometricsAvailable()]);
    return use[0] && use[1];
  }

  async remove(): Promise<void> {
    await this.logout();
    this.user = undefined;
    this._changed.next();
  }

  async getToken(): Promise<string> {
    if (!this.token) {
      await this.restoreSession();
    }
    return this.token;
  }

  async restoreSession(): Promise<DefaultSession> {
    try {
      return await super.restoreSession();
    } catch (error) {
      if (error.code === VaultErrorCodes.VaultLocked) {
        const vault = await this.getVault();
        await vault.clear();
      } else {
        throw error;
      }
    }
  }

  onSessionRestored(session: DefaultSession) {
    this._changed.next(session);
  }

  onSetupError(error: VaultError): void {
    console.error('Get error during setup', error);
  }

  onConfigChange(config: VaultConfig): void {
    console.log('Got a config update: ', config);
  }

  onVaultReady(config: VaultConfig): void {
    console.log('The service is ready with config: ', config);
  }

  onVaultUnlocked(config: VaultConfig): void {
    console.log('The vault was unlocked with config: ', config);
  }

  onVaultLocked() {
    console.log('Vault Locked');
    this._changed.next();
  }

  getPlugin(): IonicNativeAuthPlugin {
    if (this.plt.is('capacitor')) {
      return super.getPlugin();
    }
    return this.browserAuthPlugin;
  }

  async supportedBiometricTypes(): Promise<string> {
    let result = '';
    const types = await this.getAvailableHardware();
    if (types) {
      types.forEach(t => (result += `${result ? ', ' : ''}${this.translateBiometricType(t)}`));
    }
    return result;
  }

  private translateBiometricType(type: string): string {
    switch (type) {
      case 'fingerprint':
        return 'Finger Print';
      case 'face':
        return 'Face Match';
      case 'iris':
        return 'Iris Scan';
    }
  }

  async unlockSession() {
    const hasSession = await this.hasStoredSession();
    if (hasSession) {
      await this.tryRestoreSession().then(res => {
        this.router.navigate(['home']);
      });
    }
  }

  private async tryRestoreSession(): Promise<DefaultSession> {
    try {
      return await this.restoreSession();
    } catch (error) {
      if (this.notFailedOrCancelled(error)) {
        throw error;
      }
      if (error.code === VaultErrorCodes.AuthFailed) {
        alert('Unable to unlock the token');
        this.setUnlockType();
      }
    }
  }

  private notFailedOrCancelled(error: any) {
    return error.code !== VaultErrorCodes.AuthFailed && error.code !== VaultErrorCodes.UserCanceledInteraction;
  }

  private async setUnlockType(): Promise<void> {
    const previousLoginType = this.loginType;
    await this.determineLoginType();
    //  if (previousLoginType && !this.loginType) {
    if (this.loginType === '') {
      this.router.navigate(['in-app-login']);
    }
  }

  private async determineLoginType() {
    if (await this.hasStoredSession()) {
      const authMode = await this.getAuthMode();
      switch (authMode) {
        case AuthMode.BiometricAndPasscode:
          this.loginType = await this.supportedBiometricTypes();
          this.loginType += ' (Passcode Fallback)';
          break;
        case AuthMode.BiometricOnly:
          const vault = await this.getVault();
          const bioLockedOut = await vault.isLockedOutOfBiometrics();
          const bioAvailable = await this.isBiometricsAvailable();
          this.loginType = bioAvailable || bioLockedOut ? await this.supportedBiometricTypes() : '';
          break;
        case AuthMode.PasscodeOnly:
          this.loginType = 'Passcode';
          break;
      }
    } else {
      this.loginType = '';
    }
  }
}

