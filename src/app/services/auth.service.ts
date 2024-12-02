import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(this.supabaseService.currentUser);
    this.currentUser = this.supabaseService.user;

    this.currentUser.subscribe(user => {
      this.currentUserSubject.next(user);
    });
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  async signInWithGoogle() {
    try {
      await this.supabaseService.signInWithGoogle();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.supabaseService.signOut();
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
} 