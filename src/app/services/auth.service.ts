import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private userSubject: BehaviorSubject<User | null>;
  public user: Observable<User | null>;

  constructor(
    private router: Router
  ) {
    // Initialize Supabase client
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey, {
        auth: {
          // debug: true,
          lock: <R>(name: string, acquireTimeout: number, fn: () => Promise<R>) => {
            console.log("AuthService.lock", name, acquireTimeout);
            return fn();
          }
        }
      }
    );

    // Initialize user state
    this.userSubject = new BehaviorSubject<User | null>(null);
    this.user = this.userSubject.asObservable();

    // Check active sessions
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.userSubject.next(session?.user ?? null);
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log("AuthService.onAuthStateChange", event, session);
      this.userSubject.next(session?.user ?? null);
      
    });
  }

  get authenticatedUser(): BehaviorSubject<User | null> {
    return this.userSubject;
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) throw error;
    return data;
  }

  async handleAuthCallback() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    return session;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    await this.router.navigate(['/']);
  }
} 