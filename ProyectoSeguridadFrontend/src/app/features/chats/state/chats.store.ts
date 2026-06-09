import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';

import { ChatsApiService } from '../services/chats-api.service';
import {
  ChatFilterOption,
  ChatListFilter,
  ChatResumenResponse,
  ChatView,
  ConversacionResponse,
} from '../models/chat.model';

interface StoredChat extends ChatResumenResponse {
  archivado: boolean;
}

interface ChatsState {
  chats: StoredChat[];
  selectedChat: ConversacionResponse | null;
  loading: boolean;
  loadingDetail: boolean;
  error: string | null;
  searchTerm: string;
  activeFilter: ChatListFilter;
}

@Injectable({
  providedIn: 'root',
})
export class ChatsStore {
  private readonly chatsApi = inject(ChatsApiService);
  private selectChatRequestId = 0;
  private readonly markReadInFlight = new Set<string>();
  private readonly lastMarkReadAt = new Map<string, number>();

  private readonly state = signal<ChatsState>({
    chats: [],
    selectedChat: null,
    loading: false,
    loadingDetail: false,
    error: null,
    searchTerm: '',
    activeFilter: 'TODOS',
  });

  readonly chats = computed(() => this.state().chats);
  readonly selectedChat = computed(() => this.state().selectedChat);
  readonly loading = computed(() => this.state().loading);
  readonly loadingDetail = computed(() => this.state().loadingDetail);
  readonly error = computed(() => this.state().error);
  readonly searchTerm = computed(() => this.state().searchTerm);
  readonly activeFilter = computed(() => this.state().activeFilter);

  readonly selectedChatId = computed(() => this.state().selectedChat?.id ?? null);
  readonly chatFilters = computed<ChatFilterOption[]>(() => {
    const views = this.state().chats.map((chat) => this.toChatView(chat));
    const visible = views.filter((chat) => !chat.archivado);

    return [
      {
        key: 'TODOS',
        label: 'Todos',
        count: visible.length,
      },
      {
        key: 'NO_LEIDOS',
        label: 'No leidos',
        count: visible.filter((chat) => chat.noLeidos > 0).length,
      },
      {
        key: 'GRUPOS',
        label: 'Grupos',
        count: visible.filter((chat) => chat.tipo === 'GRUPO').length,
      },
      {
        key: 'ARCHIVADOS',
        label: 'Archivados',
        count: views.filter((chat) => chat.archivado).length,
      },
    ];
  });

  readonly chatViews = computed<ChatView[]>(() => {
    const term = this.normalizeText(this.state().searchTerm.trim());
    const activeFilter = this.state().activeFilter;

    return this.state()
      .chats.map((chat) => this.toChatView(chat))
      .filter((chat) => {
        if (!this.matchesActiveFilter(chat, activeFilter)) {
          return false;
        }

        if (!term) {
          return true;
        }

        const haystack = this.normalizeText(`${chat.titulo} ${chat.ultimoMensajeTexto}`);
        return haystack.includes(term);
      });
  });

  readonly totalUnread = computed(() =>
    this.state().chats.reduce((total, chat) => (chat.archivado ? total : total + chat.noLeidos), 0),
  );

  loadChats(): void {
    this.patchState({
      loading: true,
      error: null,
    });

    forkJoin({
      visibles: this.chatsApi.listChats(false),
      todas: this.chatsApi.listChats(true),
    })
      .pipe(
        finalize(() => {
          this.patchState({ loading: false });
        }),
      )
      .subscribe({
        next: ({ visibles, todas }) => {
          const idsVisibles = new Set(visibles.map((chat) => chat.id));
          const chats = todas.map<StoredChat>((chat) => ({
            ...chat,
            archivado: !idsVisibles.has(chat.id),
          }));

          this.patchState({ chats });
        },
        error: (error) => {
          this.patchState({
            error: error?.error?.message || error?.error?.error || 'No se pudieron cargar los chats.',
          });
        },
      });
  }

  selectChat(chatId: string): void {
    if (this.selectedChatId() === chatId) {
      return;
    }

    const requestId = ++this.selectChatRequestId;

    this.patchState({
      selectedChat: null,
      loadingDetail: true,
      error: null,
    });

    this.chatsApi
      .getChatById(chatId)
      .pipe(
        finalize(() => {
          if (requestId !== this.selectChatRequestId) {
            return;
          }

          this.patchState({ loadingDetail: false });
        }),
      )
      .subscribe({
        next: (chat) => {
          if (requestId !== this.selectChatRequestId) {
            return;
          }

          this.patchState({ selectedChat: chat });
        },
        error: (error) => {
          if (requestId !== this.selectChatRequestId) {
            return;
          }

          this.patchState({
            selectedChat: null,
            error: error?.error?.message || error?.error?.error || 'No se pudo abrir la conversacion.',
          });
        },
      });
  }

  createOrOpenIndividualChat(destinatarioId: string): void {
    this.patchState({
      loadingDetail: true,
      error: null,
    });

    this.chatsApi
      .createOrGetIndividualChat({ destinatarioId })
      .pipe(
        finalize(() => {
          this.patchState({ loadingDetail: false });
        }),
      )
      .subscribe({
        next: (chat) => {
          this.patchState({ selectedChat: chat });
          this.loadChats();
        },
        error: (error) => {
          this.patchState({
            error: error?.error?.message || error?.error?.error || 'No se pudo crear o abrir el chat.',
          });
        },
      });
  }

  setSearchTerm(value: string): void {
    this.patchState({
      searchTerm: value,
    });
  }

  setActiveFilter(value: ChatListFilter): void {
    this.patchState({
      activeFilter: value,
    });
  }

  clearSelectedChat(): void {
    this.patchState({
      selectedChat: null,
    });
  }

  archiveChat(chatId: string): void {
    this.chatsApi
      .updateConfig(chatId, {
        archivado: true,
      })
      .subscribe({
        next: () => {
          this.patchState({
            chats: this.state().chats.map((chat) =>
              chat.id === chatId
                ? {
                    ...chat,
                    archivado: true,
                  }
                : chat,
            ),
            selectedChat: this.state().selectedChat?.id === chatId ? null : this.state().selectedChat,
          });
        },
      });
  }

  pinChat(chatId: string, fijado: boolean): void {
    this.chatsApi
      .updateConfig(chatId, {
        fijado,
      })
      .subscribe({
        next: () => {
          this.loadChats();
        },
      });
  }

  markChatAsRead(chatId: string, force = false): void {
    if (!chatId) {
      return;
    }

    if (this.markReadInFlight.has(chatId)) {
      return;
    }

    const lastCallAt = this.lastMarkReadAt.get(chatId) ?? 0;
    if (!force && Date.now() - lastCallAt < 900) {
      return;
    }

    this.markReadInFlight.add(chatId);
    this.lastMarkReadAt.set(chatId, Date.now());

    this.chatsApi
      .markAsRead(chatId)
      .pipe(
        finalize(() => {
          this.markReadInFlight.delete(chatId);
        }),
      )
      .subscribe({
        next: () => {
          const chats = this.state().chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  noLeidos: 0,
                }
              : chat,
          );

          this.patchState({ chats });
        },
      });
  }

  private toChatView(chat: StoredChat): ChatView {
    return {
      id: chat.id,
      tipo: chat.tipo,
      titulo: chat.titulo,
      avatarUrl: chat.urlAvatar,
      creadaEn: chat.creadaEn,
      esAdmin: chat.esAdmin,
      archivado: chat.archivado,
      noLeidos: chat.noLeidos,
      ultimoMensajeTexto: chat.ultimoMensaje ? this.buildLastMessageText(chat) : 'Sin mensajes todavia',
      ultimoMensajeFecha: chat.ultimoMensaje?.creadoEn ?? null,
      ultimoMensajeTipo: chat.ultimoMensaje?.tipo ?? null,
      counterpartId: chat.contactoId ?? null,
    };
  }

  private buildLastMessageText(chat: StoredChat): string {
    if (!chat.ultimoMensaje) {
      return 'Sin mensajes todavia';
    }

    if (chat.ultimoMensaje.eliminado) {
      return 'Mensaje eliminado';
    }

    const prefix =
      chat.tipo === 'GRUPO' && chat.ultimoMensaje.remitenteUsername
        ? `${chat.ultimoMensaje.remitenteUsername}: `
        : '';

    return `${prefix}${chat.ultimoMensaje.preview}`;
  }

  private matchesActiveFilter(chat: ChatView, filter: ChatListFilter): boolean {
    if (filter === 'ARCHIVADOS') {
      return chat.archivado;
    }

    if (chat.archivado) {
      return false;
    }

    if (filter === 'NO_LEIDOS') {
      return chat.noLeidos > 0;
    }

    if (filter === 'GRUPOS') {
      return chat.tipo === 'GRUPO';
    }

    return true;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private patchState(partial: Partial<ChatsState>): void {
    this.state.update((current) => ({
      ...current,
      ...partial,
    }));
  }
}
