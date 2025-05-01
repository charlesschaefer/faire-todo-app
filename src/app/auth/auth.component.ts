import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { User } from '@supabase/supabase-js';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    CheckboxModule,
    MessageModule,
    AvatarModule,
    ToastModule,
    TranslocoModule
  ],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  currentUser: User | null = null;
  displayLoginDialog = false;
  termsAccepted = false;
  isLoading = false;
  loginError: string | null = null;

  constructor(
    private authService: AuthService,
  ) {
      this.authService.user.subscribe(user => this.currentUser = user);
  }

  showLoginDialog() {
    this.displayLoginDialog = true;
    this.loginError = null;
    this.isLoading = false;
    this.termsAccepted = false;
  }

  async signInWithGoogle() {
    if (!this.termsAccepted || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.loginError = null;

    try {
      await this.authService.signInWithGoogle();
      // The auth service will handle the redirect
    } catch (error) {
      console.error('Error signing in:', error);
      this.loginError = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred during sign in';
      this.isLoading = false;
    }
  }

  async signOut() {
    try {
      await this.authService.signOut();
      // Router navigation is now handled in the AuthService
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
} 
