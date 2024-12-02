import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private userSubject: BehaviorSubject<User | null>;
  public user: Observable<User | null>;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey, {
        auth: {
            debug: true,
            lock: <R>(name: string, acquireTimeout: number, fn: () => Promise<R>) => {
                console.log("SupabaseService.lock", name, acquireTimeout);
                return fn();
            }
        }
      }
    );

    this.userSubject = new BehaviorSubject<User | null>(null);
    this.user = this.userSubject.asObservable();

    // Check active sessions and update user subject
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.userSubject.next(session?.user ?? null);
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log("SupabaseService.onAuthStateChange", event, session);
      this.userSubject.next(session?.user ?? null);
    });
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }
} 