import { Inject, Injectable, isDevMode } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { open } from '@tauri-apps/plugin-shell';
import { HttpUrlEncodingCodec } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private userSubject: Subject<User | null>;
  public user: Observable<User | null>;
  private _currentUser?: User | null;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    @Inject('DEBUG') private DEBUG: boolean
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
          },
          debug: DEBUG
        }
      }
    );

    // Initialize user state
    this.userSubject = new Subject<User | null>();
    this.user = this.userSubject.asObservable();

    // Check active sessions
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.userSubject.next(session?.user ?? null);
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log("AuthService.onAuthStateChange", event, session);
      if (event == 'SIGNED_IN' || event == 'SIGNED_OUT') {
        this._currentUser = session?.user;
        this.userSubject.next(session?.user ?? null);
      }
    });
  }

  get authenticatedUser(): Subject<User | null> {
    return this.userSubject;
  }

  get client() {
    return this.supabase;
  }

  get currentUser(): User | null {
    return this._currentUser || null;
  }

  async signInWithGoogle() {
    console.warn(`After signing in, we're redirecting to: ${window.location.origin}/auth/callback`);
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // redirectTo: `${window.location.origin}/auth/callback`,
        redirectTo: "https://charlesschaefer.net/faire-todo-app/redirect.htm",
        skipBrowserRedirect: true
      }
    });

    if (error) throw error;
    if (isDevMode()) {
      window.location.assign(data.url);
    } else {
      // opens the auth url in a new browser session 
      await open(data.url);
    }

    return data;
  }

  async handleAuthCallback() {
    const fragment = await firstValueFrom(this.activatedRoute.fragment);
    if (!fragment) {
      // Redirect to home
      await this.router.navigate(['/']);
      return;
    }

    const encoder = new URLSearchParams(fragment);
    let  [access_token, refresh_token] = [ encoder.get('access_token') || '', encoder.get('refresh_token') || '' ];
    const {data: { session }, error } = await this.supabase.auth.setSession({ access_token, refresh_token });;

    // const { data: { session }, error } = await this.supabase.auth.getSession();
    // const { data: { session }, error } = await this.supabase.auth.refreshSession();
    if (error) throw error;
    return session;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    await this.router.navigate(['/']);
  }
} 