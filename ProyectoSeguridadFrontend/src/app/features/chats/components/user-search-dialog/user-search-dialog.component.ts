import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, finalize, Subject, switchMap } from 'rxjs';

import { PerfilResponse } from '../../../users/models/user.model';
import { UsersApiService } from '../../../users/services/users-api.service';

@Component({
  selector: 'app-user-search-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-search-dialog.component.html',
  styleUrl: './user-search-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSearchDialogComponent {
  private readonly usersApi = inject(UsersApiService);
  private readonly searchSubject = new Subject<string>();

  readonly close = output<void>();
  readonly selectUser = output<string>();

  readonly query = signal('');
  readonly users = signal<PerfilResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly hasQuery = computed(() => this.query().trim().length >= 2);

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        filter((value) => value.trim().length >= 2),
        switchMap((value) => {
          this.loading.set(true);
          this.error.set(null);

          return this.usersApi.searchUsers(value.trim(), 0, 12).pipe(
            finalize(() => {
              this.loading.set(false);
            }),
          );
        }),
      )
      .subscribe({
        next: (page) => {
          this.users.set(page.content ?? []);
        },
        error: (error) => {
          this.users.set([]);
          this.error.set(
            error?.error?.message || error?.error?.error || 'No se pudieron buscar usuarios.',
          );
        },
      });
  }

  onQueryChange(value: string): void {
    this.query.set(value);

    if (value.trim().length < 2) {
      this.users.set([]);
      this.error.set(null);
      return;
    }

    this.searchSubject.next(value);
  }

  pickUser(userId: string): void {
    this.selectUser.emit(userId);
  }

  getInitials(user: PerfilResponse): string {
    const fullName = `${user.nombres ?? ''} ${user.apellidos ?? ''}`.trim();

    if (!fullName) {
      return user.username?.charAt(0)?.toUpperCase() || 'U';
    }

    const parts = fullName.split(/\s+/);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
}
