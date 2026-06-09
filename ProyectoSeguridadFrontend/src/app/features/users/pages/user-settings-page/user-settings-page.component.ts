import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { BloqueoResponse, PerfilResponse, PrivacidadUltimoVisto } from '../../models/user.model';
import { UsersApiService } from '../../services/users-api.service';
import {
  UserPreferencesService,
  VisibilityPreference,
} from '../../services/user-preferences.service';

@Component({
  selector: 'app-user-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-settings-page.component.html',
  styleUrl: './user-settings-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettingsPageComponent implements OnInit, OnDestroy {
  private readonly usersApi = inject(UsersApiService);
  private readonly session = inject(AuthSessionService);
  private readonly preferences = inject(UserPreferencesService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly unblockingUserId = signal<string | null>(null);

  readonly profile = signal<PerfilResponse | null>(null);
  readonly blockedUsers = signal<BloqueoResponse[]>([]);

  readonly bioDraft = signal('');
  readonly privacyLastSeen = signal<PrivacidadUltimoVisto>('TODOS');
  readonly readReceiptsEnabled = signal(true);
  readonly profilePhotoVisibility = signal<VisibilityPreference>('TODOS');
  readonly onlineStatusVisibility = signal<VisibilityPreference>('TODOS');

  readonly selectedAvatarFile = signal<File | null>(null);
  readonly selectedAvatarPreviewUrl = signal<string | null>(null);

  readonly fullName = computed(() => {
    const profile = this.profile();
    if (!profile) {
      return 'Usuario';
    }

    return `${profile.nombres} ${profile.apellidos}`.trim();
  });

  readonly visibleAvatarUrl = computed(() => this.selectedAvatarPreviewUrl() || this.profile()?.urlAvatar || null);

  readonly currentLastSeenLabel = computed(() => {
    const value = this.profile()?.ultimoVisto;
    if (!value) {
      return 'No disponible';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'No disponible';
    }

    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  readonly canSave = computed(() => !this.loading() && !this.saving() && !!this.profile());

  private avatarPreviewObjectUrl: string | null = null;

  ngOnInit(): void {
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.clearAvatarPreviewObjectUrl();
  }

  loadSettings(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.hydrateLocalPreferences();

    forkJoin({
      me: this.usersApi.getMe(),
      blocked: this.usersApi.getBlockedUsers(),
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: ({ me, blocked }) => {
          const normalizedProfile = this.normalizeProfile(me);
          this.profile.set(normalizedProfile);
          this.blockedUsers.set(blocked);
          this.bioDraft.set(normalizedProfile.bio || '');
          this.privacyLastSeen.set(normalizedProfile.privacidadUltimoVisto || 'TODOS');
          this.session.setProfile(normalizedProfile);
        },
        error: (error) => {
          this.errorMessage.set(
            error?.error?.message || error?.error?.error || 'No se pudo cargar la configuracion de usuario.',
          );
        },
      });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      return;
    }

    this.selectedAvatarFile.set(file);
    this.setAvatarPreview(file);
    input.value = '';
  }

  clearSelectedAvatar(): void {
    this.selectedAvatarFile.set(null);
    this.clearAvatarPreviewObjectUrl();
    this.selectedAvatarPreviewUrl.set(null);
  }

  setPrivacyLastSeen(value: PrivacidadUltimoVisto): void {
    this.privacyLastSeen.set(value);
  }

  setReadReceiptsEnabled(value: boolean): void {
    this.readReceiptsEnabled.set(value);
  }

  setProfilePhotoVisibility(value: VisibilityPreference): void {
    this.profilePhotoVisibility.set(value);
  }

  setOnlineStatusVisibility(value: VisibilityPreference): void {
    this.onlineStatusVisibility.set(value);
  }

  saveSettings(): void {
    if (!this.canSave()) {
      return;
    }

    const currentProfile = this.profile();
    if (!currentProfile) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const normalizedCurrentPrivacy = this.normalizePrivacyValue(currentProfile.privacidadUltimoVisto);
    const trimmedBio = this.bioDraft().trim();
    const normalizedCurrentBio = currentProfile.bio?.trim() || '';

    const hasBackendChanges =
      !!this.selectedAvatarFile() ||
      trimmedBio !== normalizedCurrentBio ||
      this.privacyLastSeen() !== normalizedCurrentPrivacy;

    const previousPreferences = this.preferences.all();
    const hasLocalPreferenceChanges =
      this.readReceiptsEnabled() !== previousPreferences.readReceiptsEnabled ||
      this.profilePhotoVisibility() !== previousPreferences.profilePhotoVisibility ||
      this.onlineStatusVisibility() !== previousPreferences.onlineStatusVisibility;

    if (!hasBackendChanges && !hasLocalPreferenceChanges) {
      this.saving.set(false);
      this.successMessage.set('No hay cambios por guardar.');
      return;
    }

    const saveLocalPreferences = (): void => {
      this.preferences.update({
        readReceiptsEnabled: this.readReceiptsEnabled(),
        profilePhotoVisibility: this.profilePhotoVisibility(),
        onlineStatusVisibility: this.onlineStatusVisibility(),
      });
    };

    if (!hasBackendChanges) {
      saveLocalPreferences();
      this.saving.set(false);
      this.successMessage.set('Preferencias de privacidad actualizadas.');
      return;
    }

    this.usersApi
      .updateProfile({
        avatar: this.selectedAvatarFile(),
        bio: trimmedBio,
        privacidadUltimoVisto: this.privacyLastSeen(),
      })
      .pipe(
        finalize(() => {
          this.saving.set(false);
        }),
      )
      .subscribe({
        next: (updatedProfile) => {
          const normalizedProfile = this.normalizeProfile(updatedProfile);
          this.profile.set(normalizedProfile);
          this.session.setProfile(normalizedProfile);
          this.bioDraft.set(normalizedProfile.bio || '');
          this.privacyLastSeen.set(normalizedProfile.privacidadUltimoVisto || 'TODOS');
          this.clearSelectedAvatar();
          saveLocalPreferences();
          this.successMessage.set('Configuracion actualizada correctamente.');
        },
        error: (error) => {
          this.errorMessage.set(
            error?.error?.message || error?.error?.error || 'No se pudo actualizar la configuracion.',
          );
        },
      });
  }

  unblockUser(userId: string): void {
    if (!userId || this.unblockingUserId()) {
      return;
    }

    this.unblockingUserId.set(userId);
    this.errorMessage.set(null);

    this.usersApi
      .unblockUser(userId)
      .pipe(
        finalize(() => {
          this.unblockingUserId.set(null);
        }),
      )
      .subscribe({
        next: () => {
          this.blockedUsers.update((current) => current.filter((blockedUser) => blockedUser.bloqueadoId !== userId));
        },
        error: (error) => {
          this.errorMessage.set(
            error?.error?.message || error?.error?.error || 'No se pudo desbloquear al usuario.',
          );
        },
      });
  }

  private hydrateLocalPreferences(): void {
    const current = this.preferences.all();
    this.readReceiptsEnabled.set(current.readReceiptsEnabled);
    this.profilePhotoVisibility.set(current.profilePhotoVisibility);
    this.onlineStatusVisibility.set(current.onlineStatusVisibility);
  }

  private normalizeProfile(profile: PerfilResponse): PerfilResponse {
    return {
      ...profile,
      privacidadUltimoVisto: this.normalizePrivacyValue(profile.privacidadUltimoVisto),
    };
  }

  private normalizePrivacyValue(value: unknown): PrivacidadUltimoVisto {
    const parsed = `${value ?? ''}`.toUpperCase();
    if (parsed === 'NADIE') {
      return 'NADIE';
    }

    return 'TODOS';
  }

  private setAvatarPreview(file: File): void {
    this.clearAvatarPreviewObjectUrl();
    this.avatarPreviewObjectUrl = URL.createObjectURL(file);
    this.selectedAvatarPreviewUrl.set(this.avatarPreviewObjectUrl);
  }

  private clearAvatarPreviewObjectUrl(): void {
    if (this.avatarPreviewObjectUrl) {
      URL.revokeObjectURL(this.avatarPreviewObjectUrl);
      this.avatarPreviewObjectUrl = null;
    }
  }
}
