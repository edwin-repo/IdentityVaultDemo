import { Component, OnInit } from '@angular/core';
import { IdentityService } from '../services/IdentityService.service';
import { SettingsService } from '../services/settings.service';
import { Platform } from '@ionic/angular';
import { AuthMode } from '@ionic-enterprise/identity-vault';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  useBiometrics: boolean;
  usePasscode: boolean;
  useSecureStorageMode: boolean;
  biometricType: string;
  isMobile: boolean;
  isBiometricAvailable: boolean;

  constructor(
    private platform: Platform,
    private identity: IdentityService,
    private settings: SettingsService) { }

  async ngOnInit() {
    this.isMobile = this.platform.is('mobile') ? true : false;
    await this.identity.ready();
    await this.setAuthModeFlags();
    this.biometricType = await this.identity.supportedBiometricTypes();
    this.isBiometricAvailable = await this.identity.isBiometricsSupported();
  }

  onBiometricClick() {
    if (this.isBiometricAvailable) {
      this.useBiometrics = !this.useBiometrics;
      this.identity.unlock();
      this.authModeChanged();
    } else {
      alert('Biometric not avialable');
    }
  }

  onPassClick() {
    this.usePasscode = !this.usePasscode;
    this.identity.unlock();
    this.authModeChanged();

  }

  onSecureClick() {
    this.usePasscode = false;
    this.useBiometrics = false;
    this.identity.unlock();
    this.useSecureStorageMode = !this.useSecureStorageMode;

  }

  async authModeChanged() {
    if (this.useSecureStorageMode) {
      await this.identity.setAuthMode(AuthMode.SecureStorage).catch(err => { console.log(err) });
    } else if (this.useBiometrics && this.usePasscode) {
      await this.identity.setAuthMode(AuthMode.BiometricAndPasscode).catch(err => { console.log(err) });
    } else if (this.useBiometrics && !this.usePasscode) {
      await this.identity.setAuthMode(AuthMode.BiometricOnly).catch(err => { console.log(err) });
    } else if (this.usePasscode && !this.useBiometrics) {
      await this.identity.setAuthMode(AuthMode.PasscodeOnly).catch(err => { console.log(err) });
    } else {
      await this.identity.setAuthMode(AuthMode.InMemoryOnly).catch(err => { console.log(err) });
    }
    await this.setAuthModeFlags();
  }

  lock() {
    this.identity.lockOut();
  }

  private async setAuthModeFlags() {
    this.usePasscode = await this.identity.isPasscodeEnabled();
    this.useBiometrics = await this.identity.isBiometricsEnabled();
    this.useSecureStorageMode = await this.identity.isSecureStorageModeEnabled();
    this.settings.store({
      useBiometrics: this.useBiometrics,
      usePasscode: this.usePasscode,
      useSecureStorageMode: this.useSecureStorageMode
    });
  }


}
