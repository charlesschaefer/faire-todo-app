import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../auth.service';
import { firstValueFrom } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

@Component({
    selector: 'app-auth-callback',
    standalone: true,
    imports: [CommonModule, TranslocoModule],
    template: `
    <div class="callback-container">
      {{ 'Processing authentication...' | transloco }}
    </div>
  `,
    styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 1.1rem;
      color: var(--p-text-muted-color);
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
    constructor (
        private authService: AuthService,
        private router: Router,
        private messageService: MessageService,
        private translate: TranslocoService,
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
                    summary: await firstValueFrom(this.translate.selectTranslate('Authentication Successful')),
                    detail: await firstValueFrom(this.translate.selectTranslate('You can now save your tasks online')),
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
                summary: await firstValueFrom(this.translate.selectTranslate('Authentication Failed')),
                detail: error instanceof Error
                    ? error.message
                    : await firstValueFrom(this.translate.selectTranslate('An unexpected error occurred during authentication')),
                life: 8000
            });
        }
    }
} 