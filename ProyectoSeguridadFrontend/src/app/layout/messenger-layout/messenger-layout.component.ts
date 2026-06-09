import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthApiService } from '../../features/auth/services/auth-api.service';
import { UsersApiService } from '../../features/users/services/users-api.service';
import { AuthSessionService } from '../../core/auth/auth-session.service';

@Component({
  selector: 'app-messenger-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './messenger-layout.component.html',
  styleUrl: './messenger-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessengerLayoutComponent implements OnInit {
  private readonly usersApi = inject(UsersApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  readonly profile = this.session.profile;
  readonly loggingOut = signal(false);

  ngOnInit(): void {
    if (!this.profile()) {
      this.usersApi.getMe().subscribe({
        next: (profile) => this.session.setProfile(profile),
      });
    }
  }

  logout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);

    this.authApi
      .logout()
      .pipe(finalize(() => this.loggingOut.set(false)))
      .subscribe({
        next: () => {
          this.session.clear();
          this.router.navigate(['/auth/login']);
        },
        error: () => {
          this.session.clear();
          this.router.navigate(['/auth/login']);
        },
      });
  }
}
