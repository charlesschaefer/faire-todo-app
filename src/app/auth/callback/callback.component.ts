import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-auth-callback',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    template: `
    <div class="callback-container">
      {{ 'Processing authentication...' | translate }}
    </div>
  `,
    styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 1.1rem;
      color: var(--text-color-secondary);
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
    constructor (
        private authService: AuthService,
        private router: Router,
        private messageService: MessageService,
        private translate: TranslateService,
        private activatedRoute: ActivatedRoute
    ) { }

    async ngOnInit() {
        try {
            const result = await this.authService.handleAuthCallback();

            if (!result) {
                throw new Error('No session found');
            }
            this.activatedRoute.fragment.subscribe(async (fragment: string | null) => {
                if (!fragment) {
                    // Redirect to home
                    await this.router.navigate(['/']);
                    return;
                }
                // Show success message
                this.messageService.add({
                    severity: 'info',
                    summary: await firstValueFrom(this.translate.get('Authentication Successful')),
                    detail: await firstValueFrom(this.translate.get('You can now save your tasks online')),
                    life: 5000,
                    key: 'auth-messages'
                });
            });

        } catch (error) {
            console.error('Auth callback error:', error);

            // Redirect to home
            await this.router.navigate(['/']);

            // Show error message
            this.messageService.add({
                severity: 'error',
                summary: await firstValueFrom(this.translate.get('Authentication Failed')),
                detail: error instanceof Error
                    ? error.message
                    : await firstValueFrom(this.translate.get('An unexpected error occurred during authentication')),
                life: 8000
            });
        }
    }
} 