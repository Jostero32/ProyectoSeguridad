import { Injectable, computed, signal } from '@angular/core';

export type VisibilityPreference = 'TODOS' | 'NADIE';

interface UserPreferencesState {
  readReceiptsEnabled: boolean;
  profilePhotoVisibility: VisibilityPreference;
  onlineStatusVisibility: VisibilityPreference;
}

const STORAGE_KEY = 'cipherchat.user_preferences.v1';

@Injectable({
  providedIn: 'root',
})
export class UserPreferencesService {
  private readonly state = signal<UserPreferencesState>(this.readInitialState());

  readonly readReceiptsEnabled = computed(() => this.state().readReceiptsEnabled);
  readonly profilePhotoVisibility = computed(() => this.state().profilePhotoVisibility);
  readonly onlineStatusVisibility = computed(() => this.state().onlineStatusVisibility);
  readonly all = computed(() => this.state());

  update(partial: Partial<UserPreferencesState>): void {
    this.state.update((current) => {
      const next = {
        ...current,
        ...partial,
      };

      this.persist(next);
      return next;
    });
  }

  private readInitialState(): UserPreferencesState {
    if (typeof window === 'undefined') {
      return this.getDefaultState();
    }

    const fallback = this.getDefaultState();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return fallback;
      }

      const parsed = JSON.parse(raw) as Partial<UserPreferencesState>;
      return {
        readReceiptsEnabled:
          typeof parsed.readReceiptsEnabled === 'boolean'
            ? parsed.readReceiptsEnabled
            : fallback.readReceiptsEnabled,
        profilePhotoVisibility:
          parsed.profilePhotoVisibility === 'NADIE' ? 'NADIE' : fallback.profilePhotoVisibility,
        onlineStatusVisibility:
          parsed.onlineStatusVisibility === 'NADIE' ? 'NADIE' : fallback.onlineStatusVisibility,
      };
    } catch {
      return fallback;
    }
  }

  private persist(state: UserPreferencesState): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private getDefaultState(): UserPreferencesState {
    return {
      readReceiptsEnabled: true,
      profilePhotoVisibility: 'TODOS',
      onlineStatusVisibility: 'TODOS',
    };
  }
}
