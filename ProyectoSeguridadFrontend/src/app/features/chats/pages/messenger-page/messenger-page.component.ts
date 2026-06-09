import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription, finalize, forkJoin } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { ChatSidebarComponent } from '../../components/chat-sidebar/chat-sidebar.component';
import { UserSearchDialogComponent } from '../../components/user-search-dialog/user-search-dialog.component';
import {
  ArchivoMultimediaResponse,
  CifradoPayload,
  EstadoMensajeResponse,
  MensajeResponse,
  MultimediaPayload,
  TextoPayload,
  TipoMensajeArchivo,
} from '../../models/message.model';
import { ChatFilesApiService } from '../../services/chat-files-api.service';
import { ChatE2eeService } from '../../services/chat-e2ee.service';
import { ChatRealtimeService, WsEventEnvelope } from '../../services/chat-realtime.service';
import { MessagesApiService } from '../../services/messages-api.service';
import { ChatsStore } from '../../state/chats.store';
import {
  ActualizarConfiguracionRequest,
  ChatListFilter,
  ChatView,
  ConfiguracionChatResponse,
  ParticipanteResponse,
} from '../../models/chat.model';
import { ChatsApiService } from '../../services/chats-api.service';
import { UsersApiService } from '../../../users/services/users-api.service';
import { UserPreferencesService } from '../../../users/services/user-preferences.service';

interface EstadoEntregaWsPayload {
  mensajeId: string;
  conversacionId: string;
  usuarioId: string;
  entregadoEn: string | null;
  leidoEn: string | null;
}

interface EscribiendoWsPayload {
  conversacionId: string;
  usuarioId: string;
  username: string;
}

interface PresenciaWsPayload {
  usuarioId: string;
  username: string;
  conectado: boolean;
  ultimoVisto: string | null;
}

interface DeliveryState {
  entregadoEn: string | null;
  leidoEn: string | null;
}

type OwnMessageStatus = 'ENVIADO' | 'RECIBIDO' | 'VISTO';
type ChatBackgroundPreset = 'ocean' | 'sunset' | 'forest' | 'slate';
type ChatInfoSection = 'RESUMEN' | 'PERSONALIZAR' | 'GESTION';

@Component({
  selector: 'app-messenger-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatSidebarComponent, UserSearchDialogComponent],
  templateUrl: './messenger-page.component.html',
  styleUrl: './messenger-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessengerPageComponent implements OnInit, OnDestroy {
  private readonly chatsApi = inject(ChatsApiService);
  private readonly usersApi = inject(UsersApiService);
  private readonly messagesApi = inject(MessagesApiService);
  private readonly filesApi = inject(ChatFilesApiService);
  private readonly e2ee = inject(ChatE2eeService);
  private readonly realtime = inject(ChatRealtimeService);
  private readonly session = inject(AuthSessionService);
  private readonly userPreferences = inject(UserPreferencesService);
  private readonly subscriptions = new Subscription();

  readonly chatsStore = inject(ChatsStore);

  readonly newChatDialogOpen = signal(false);
  readonly mobileChatOpen = signal(false);
  readonly isMobile = signal(false);
  readonly isDesktopInfoVisible = signal(false);
  readonly chatInfoPanelOpen = signal(false);
  readonly chatInfoSection = signal<ChatInfoSection>('RESUMEN');

  readonly baseChats = this.chatsStore.chatViews;
  readonly selectedChat = this.chatsStore.selectedChat;
  readonly selectedChatId = this.chatsStore.selectedChatId;
  readonly loading = this.chatsStore.loading;
  readonly loadingDetail = this.chatsStore.loadingDetail;
  readonly error = this.chatsStore.error;
  readonly totalUnread = this.chatsStore.totalUnread;
  readonly searchTerm = this.chatsStore.searchTerm;
  readonly activeChatFilter = this.chatsStore.activeFilter;
  readonly chatFilters = this.chatsStore.chatFilters;
  readonly readReceiptsEnabled = this.userPreferences.readReceiptsEnabled;
  readonly onlineStatusVisibility = this.userPreferences.onlineStatusVisibility;

  readonly messages = signal<MensajeResponse[]>([]);
  readonly loadingMessages = signal(false);
  readonly loadingOlderMessages = signal(false);
  readonly hasMoreMessages = signal(false);
  readonly sendingMessage = signal(false);
  readonly messageDraft = signal('');
  readonly messagesError = signal<string | null>(null);

  readonly selectedAttachment = signal<File | null>(null);
  readonly selectedAttachmentType = signal<TipoMensajeArchivo | null>(null);
  readonly selectedAttachmentPreviewUrl = signal<string | null>(null);
  readonly actionsMenuOpen = signal(false);
  readonly loadingChatConfig = signal(false);
  readonly loadingBlockedUsers = signal(false);
  readonly loadingCounterpart = signal(false);
  readonly updatingChatAction = signal<string | null>(null);
  readonly chatActionsError = signal<string | null>(null);
  readonly chatConfig = signal<ConfiguracionChatResponse | null>(null);
  readonly counterpartUserId = signal<string | null>(null);
  readonly blockedUserIds = signal<Record<string, true>>({});
  readonly blockedByCounterpart = signal(false);
  readonly dismissedSecurityBannerChats = signal<Record<string, true>>({});
  readonly chatBackgroundsByChat = signal<Record<string, ChatBackgroundPreset>>({});

  readonly temporaryFileUrls = signal<Record<string, string>>({});
  readonly resolvingFileUrls = signal<Record<string, boolean>>({});
  readonly decryptedTextByMessageId = signal<Record<string, string>>({});
  readonly typingUsersByChat = signal<Record<string, Record<string, string>>>({});
  readonly presenceByUser = signal<Record<string, PresenciaWsPayload>>({});
  readonly deliveryOverrides = signal<Record<string, Record<string, DeliveryState>>>({});

  readonly chats = computed<ChatView[]>(() => {
    const typingMap = this.typingUsersByChat();
    const presenceMap = this.presenceByUser();

    return this.baseChats().map((chat) => {
      const counterpartId = chat.counterpartId ?? null;
      const presence = counterpartId ? presenceMap[counterpartId] : null;
      const typingText = this.buildTypingLabel(Object.values(typingMap[chat.id] ?? {}));

      const chatWithPresence: ChatView = {
        ...chat,
        counterpartOnline: !!presence?.conectado,
        counterpartLastSeen: presence?.ultimoVisto ?? null,
      };

      if (!typingText) {
        return {
          ...chatWithPresence,
          escribiendo: false,
        };
      }

      return {
        ...chatWithPresence,
        ultimoMensajeTexto: typingText,
        escribiendo: true,
      };
    });
  });

  readonly typingIndicatorText = computed(() => {
    const chatId = this.selectedChatId();
    if (!chatId) {
      return null;
    }

    const users = Object.values(this.typingUsersByChat()[chatId] ?? {});
    return this.buildTypingLabel(users);
  });

  readonly selectedChatPresenceLabel = computed(() => {
    const chat = this.selectedChat();
    if (!chat) {
      return '';
    }

    if (chat.tipo === 'GRUPO') {
      return `${chat.totalMiembros} miembros`;
    }

    const counterpartUserId = this.counterpartUserId();
    if (!counterpartUserId) {
      return 'Desconectado';
    }

    const presence = this.presenceByUser()[counterpartUserId];
    if (presence?.conectado) {
      return 'En linea';
    }

    if (presence?.ultimoVisto) {
      return `Ult. vez ${this.formatPresenceLastSeen(presence.ultimoVisto)}`;
    }

    return 'Desconectado';
  });

  readonly canSendMessage = computed(() => {
    const hasText = this.messageDraft().trim().length > 0;
    const hasAttachment = !!this.selectedAttachment();

    return (
      !!this.selectedChat() &&
      !this.loadingDetail() &&
      !this.sendingMessage() &&
      !this.isMessagingBlocked() &&
      (hasText || hasAttachment)
    );
  });

  readonly isIndividualChat = computed(() => this.selectedChat()?.tipo === 'INDIVIDUAL');

  readonly isCounterpartBlocked = computed(() => {
    const counterpartUserId = this.counterpartUserId();
    if (!counterpartUserId) {
      return false;
    }

    return !!this.blockedUserIds()[counterpartUserId];
  });

  readonly isMessagingBlocked = computed(() => {
    if (!this.isIndividualChat()) {
      return false;
    }

    return this.isCounterpartBlocked() || this.blockedByCounterpart();
  });

  readonly isActionBusy = computed(() => this.updatingChatAction() !== null);

  readonly chatMediaCount = computed(() =>
    this.messages().filter(
      (message) =>
        !message.eliminado &&
        !message.eliminadoParaTodos &&
        ['IMAGEN', 'VIDEO', 'GIF', 'STICKER'].includes(message.tipo),
    ).length,
  );

  readonly chatDocumentCount = computed(() =>
    this.messages().filter(
      (message) => !message.eliminado && !message.eliminadoParaTodos && message.tipo === 'DOCUMENTO',
    ).length,
  );

  readonly chatSharedLinks = computed(() => {
    const links: string[] = [];
    const seen = new Set<string>();

    for (const message of this.messages()) {
      if (message.eliminado || message.eliminadoParaTodos) {
        continue;
      }

      const text = this.getMessageText(message);
      if (!text) {
        continue;
      }

      const matches = text.match(/https?:\/\/[^\s<>"')\]]+/gi) ?? [];
      for (const rawLink of matches) {
        const normalized = rawLink.replace(/[.,!?;:]+$/g, '');
        if (!normalized || seen.has(normalized)) {
          continue;
        }

        seen.add(normalized);
        links.push(normalized);
      }
    }

    return links.slice(0, 12);
  });

  readonly chatBackgroundStyle = computed(() => {
    const preset = this.getSelectedChatBackgroundPreset();
    switch (preset) {
      case 'sunset':
        return {
          backgroundImage:
            'radial-gradient(circle at top right, rgba(251,191,36,0.14), transparent 36%), radial-gradient(circle at bottom left, rgba(244,63,94,0.16), transparent 40%)',
        };
      case 'forest':
        return {
          backgroundImage:
            'radial-gradient(circle at top right, rgba(16,185,129,0.12), transparent 35%), radial-gradient(circle at bottom left, rgba(34,197,94,0.12), transparent 40%)',
        };
      case 'slate':
        return {
          backgroundImage:
            'radial-gradient(circle at top right, rgba(148,163,184,0.14), transparent 36%), radial-gradient(circle at bottom left, rgba(100,116,139,0.16), transparent 40%)',
        };
      default:
        return {
          backgroundImage:
            'radial-gradient(circle at top right,rgba(34,211,238,0.08),transparent 32%),radial-gradient(circle at bottom left,rgba(99,102,241,0.10),transparent 34%)',
        };
    }
  });

  readonly muteStatusLabel = computed(() => {
    const config = this.chatConfig();
    if (!config?.silenciado) {
      return 'Notificaciones activas';
    }

    if (!config.silenciadoHasta) {
      return 'Silenciado';
    }

    const until = new Date(config.silenciadoHasta);
    if (Number.isNaN(until.getTime())) {
      return 'Silenciado';
    }

    return `Silenciado hasta ${until.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}`;
  });

  readonly isInfoOverlayOpen = computed(
    () => this.chatInfoPanelOpen() && !this.isDesktopInfoVisible() && !!this.selectedChat(),
  );

  readonly isDesktopInfoPanelOpen = computed(
    () => this.chatInfoPanelOpen() && this.isDesktopInfoVisible() && !!this.selectedChat(),
  );

  readonly isNewIndividualConversation = computed(() => {
    if (!this.isIndividualChat()) {
      return false;
    }

    const selectedChat = this.selectedChat();
    if (!selectedChat) {
      return false;
    }

    const messageCount = this.messages().length;
    if (messageCount <= 6) {
      return true;
    }

    const createdAt = new Date(selectedChat.creadaEn);
    return this.isWithinLastDays(createdAt, 14);
  });

  readonly shouldShowSecurityBanner = computed(() => {
    const chatId = this.selectedChatId();
    if (!chatId || !this.isIndividualChat()) {
      return false;
    }

    if (this.dismissedSecurityBannerChats()[chatId]) {
      return false;
    }

    if (this.loadingDetail() || this.loadingMessages()) {
      return false;
    }

    return this.isNewIndividualConversation();
  });

  @ViewChild('messagesContainer')
  private messagesContainer?: ElementRef<HTMLElement>;
  @ViewChild('chatActionsMenu')
  private chatActionsMenu?: ElementRef<HTMLElement>;
  @ViewChild('chatActionsTrigger')
  private chatActionsTrigger?: ElementRef<HTMLElement>;

  private lastLoadedChatId: string | null = null;
  private attachmentPreviewObjectUrl: string | null = null;
  private readonly pageSize = 40;
  private currentPage = 0;
  private localTypingChatId: string | null = null;
  private localTypingStopTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastTypingSentAt = 0;
  private readonly remoteTypingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private pendingReadMarkTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingInitialScrollChatId: string | null = null;
  private readonly chatBackgroundStorageKey = 'cipherchat.chat_backgrounds.v1';
  private readonly debugLogsEnabled = true;

  constructor() {
    effect(() => {
      const chatId = this.selectedChat()?.id ?? null;
      this.debugLog('effect.selectedChat', {
        chatId,
        lastLoadedChatId: this.lastLoadedChatId,
        isMobile: this.isMobile(),
        mobileChatOpen: this.mobileChatOpen(),
      });

      if (!chatId) {
        this.stopLocalTyping();
        this.lastLoadedChatId = null;
        this.pendingInitialScrollChatId = null;
        this.actionsMenuOpen.set(false);
        this.chatInfoPanelOpen.set(false);
        this.chatInfoSection.set('RESUMEN');
        this.chatActionsError.set(null);
        this.chatConfig.set(null);
        this.counterpartUserId.set(null);
        this.blockedByCounterpart.set(false);
        this.messages.set([]);
        this.messageDraft.set('');
        this.messagesError.set(null);
        this.loadingOlderMessages.set(false);
        this.hasMoreMessages.set(false);
        this.selectedAttachment.set(null);
        this.selectedAttachmentType.set(null);
        this.clearAttachmentPreview();
        this.temporaryFileUrls.set({});
        this.resolvingFileUrls.set({});
        this.decryptedTextByMessageId.set({});
        this.deliveryOverrides.set({});
        return;
      }

      if (chatId === this.lastLoadedChatId) {
        return;
      }

      this.stopLocalTyping();
      this.lastLoadedChatId = chatId;
      this.pendingInitialScrollChatId = chatId;
      this.actionsMenuOpen.set(false);
      this.chatInfoSection.set('RESUMEN');
      if (!this.isDesktopInfoVisible()) {
        this.chatInfoPanelOpen.set(false);
      }
      this.chatActionsError.set(null);
      this.chatConfig.set(null);
      this.counterpartUserId.set(null);
      this.blockedByCounterpart.set(false);
      this.messageDraft.set('');
      this.selectedAttachment.set(null);
      this.selectedAttachmentType.set(null);
      this.clearAttachmentPreview();
      this.temporaryFileUrls.set({});
      this.resolvingFileUrls.set({});
      this.decryptedTextByMessageId.set({});
      this.deliveryOverrides.set({});
      this.loadMessages(chatId);
      this.loadChatConfig(chatId);
      this.loadBlockedUsers();
      this.loadCounterpartUserId(chatId);
    });

    effect(() => {
      const sharePresence = this.onlineStatusVisibility() !== 'NADIE';
      this.realtime.setPresenceSharingEnabled(sharePresence);
    });
  }

  ngOnInit(): void {
    this.loadStoredChatBackgrounds();
    this.updateViewportMode();
    this.chatsStore.loadChats();
    this.realtime.connect();
    this.subscriptions.add(this.realtime.events$.subscribe((event) => this.handleRealtimeEvent(event)));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.stopLocalTyping();
    this.clearRemoteTypingUsers();
    if (this.pendingReadMarkTimeout) {
      clearTimeout(this.pendingReadMarkTimeout);
      this.pendingReadMarkTimeout = null;
    }
    this.realtime.disconnect();
    this.presenceByUser.set({});
    this.clearAttachmentPreview();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportMode();
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    this.realtime.sendPresencePing();
    this.scheduleMarkCurrentChatAsRead(true);
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (!document.hidden) {
      this.realtime.sendPresencePing();
      this.scheduleMarkCurrentChatAsRead(true);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.actionsMenuOpen()) {
      return;
    }

    const target = event.target as Node | null;
    const menuElement = this.chatActionsMenu?.nativeElement;
    const triggerElement = this.chatActionsTrigger?.nativeElement;
    if (!target || !menuElement || !triggerElement) {
      return;
    }

    if (menuElement.contains(target) || triggerElement.contains(target)) {
      return;
    }

    this.closeActionsMenu();
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    this.closeActionsMenu();
    this.closeChatInfoPanel();
  }

  openChat(chatId: string): void {
    const sameSelectedChat = this.selectedChatId() === chatId;
    this.chatInfoPanelOpen.set(false);

    this.debugLog('openChat.click', {
      chatId,
      isMobile: this.isMobile(),
      mobileChatOpenBefore: this.mobileChatOpen(),
      selectedChatIdBefore: this.selectedChatId(),
      sameSelectedChat,
    });

    this.chatsStore.selectChat(chatId);

    if (this.isMobile()) {
      this.mobileChatOpen.set(true);
      this.debugLog('openChat.mobileOpen', {
        chatId,
        mobileChatOpenAfter: this.mobileChatOpen(),
      });
    }

    if (sameSelectedChat) {
      this.pendingInitialScrollChatId = chatId;
      this.debugLog('openChat.sameChat.reanchor', {
        chatId,
        isMobile: this.isMobile(),
        mobileChatOpen: this.mobileChatOpen(),
      });
      this.tryInitialScrollToBottom(chatId);
      this.scheduleMarkCurrentChatAsRead(true);
    }
  }

  backToChats(): void {
    this.mobileChatOpen.set(false);
    this.chatInfoPanelOpen.set(false);
    this.debugLog('backToChats', {
      selectedChatId: this.selectedChatId(),
      isMobile: this.isMobile(),
      mobileChatOpen: this.mobileChatOpen(),
    });
  }

  openNewChatDialog(): void {
    this.newChatDialogOpen.set(true);
  }

  closeNewChatDialog(): void {
    this.newChatDialogOpen.set(false);
  }

  createIndividualChat(userId: string): void {
    this.chatsStore.createOrOpenIndividualChat(userId);
    this.newChatDialogOpen.set(false);

    if (this.isMobile()) {
      this.mobileChatOpen.set(true);
    }
  }

  refreshChats(): void {
    this.chatsStore.loadChats();
  }

  setSearchTerm(value: string): void {
    this.chatsStore.setSearchTerm(value);
  }

  setChatFilter(value: ChatListFilter): void {
    this.chatsStore.setActiveFilter(value);
  }

  openChatInfoPanel(): void {
    if (!this.selectedChat()) {
      return;
    }

    this.chatInfoSection.set('RESUMEN');
    this.chatInfoPanelOpen.set(true);
    this.closeActionsMenu();
  }

  closeChatInfoPanel(): void {
    if (!this.chatInfoPanelOpen()) {
      return;
    }

    this.chatInfoPanelOpen.set(false);
  }

  setChatInfoSection(section: ChatInfoSection): void {
    this.chatInfoSection.set(section);
  }

  muteForHours(hours: number): void {
    this.applyChatConfigUpdate('mute', {
      silenciadoHasta: this.formatLocalDateTime(new Date(Date.now() + hours * 60 * 60 * 1000)),
    });
  }

  muteForDays(days: number): void {
    this.applyChatConfigUpdate('mute', {
      silenciadoHasta: this.formatLocalDateTime(new Date(Date.now() + days * 24 * 60 * 60 * 1000)),
    });
  }

  muteForever(): void {
    this.applyChatConfigUpdate('mute', {
      silenciadoHasta: this.formatLocalDateTime(new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 20)),
    });
  }

  unmuteChat(): void {
    this.applyChatConfigUpdate('mute', {
      silenciadoHasta: null,
    });
  }

  setChatBackground(preset: ChatBackgroundPreset): void {
    const chatId = this.selectedChatId();
    if (!chatId) {
      return;
    }

    this.chatBackgroundsByChat.update((current) => {
      const updated = {
        ...current,
        [chatId]: preset,
      };
      this.persistChatBackgrounds(updated);
      return updated;
    });
  }

  isChatBackgroundActive(preset: ChatBackgroundPreset): boolean {
    return this.getSelectedChatBackgroundPreset() === preset;
  }

  reportChat(): void {
    this.chatActionsError.set(
      'Reporte recibido. Nuestro equipo revisara esta conversacion en la siguiente ventana de moderacion.',
    );
    this.closeActionsMenu();
  }

  toggleActionsMenu(event?: Event): void {
    event?.stopPropagation();

    if (!this.selectedChatId()) {
      return;
    }

    this.chatActionsError.set(null);
    this.actionsMenuOpen.update((current) => !current);
  }

  closeActionsMenu(): void {
    this.actionsMenuOpen.set(false);
  }

  dismissSecurityBanner(): void {
    const chatId = this.selectedChatId();
    if (!chatId) {
      return;
    }

    this.dismissedSecurityBannerChats.update((current) => ({
      ...current,
      [chatId]: true,
    }));
  }

  toggleArchiveStatus(): void {
    const config = this.chatConfig();
    if (!config) {
      return;
    }

    this.applyChatConfigUpdate('archive', {
      archivado: !config.archivado,
    });
  }

  togglePinStatus(): void {
    const config = this.chatConfig();
    if (!config) {
      return;
    }

    this.applyChatConfigUpdate('pin', {
      fijado: !config.fijado,
    });
  }

  toggleMuteStatus(): void {
    const config = this.chatConfig();
    if (!config) {
      return;
    }

    this.applyChatConfigUpdate('mute', {
      silenciadoHasta: config.silenciado
        ? null
        : this.formatLocalDateTime(new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 20)),
    });
  }

  toggleBlockStatus(): void {
    if (!this.isIndividualChat()) {
      return;
    }

    const counterpartUserId = this.counterpartUserId();
    if (!counterpartUserId) {
      this.chatActionsError.set('No se pudo identificar al contacto para bloquear/desbloquear.');
      return;
    }

    const currentlyBlocked = this.isCounterpartBlocked();
    this.updatingChatAction.set('block');
    this.chatActionsError.set(null);

    const request$ = currentlyBlocked
      ? this.usersApi.unblockUser(counterpartUserId)
      : this.usersApi.blockUser(counterpartUserId);

    request$.subscribe({
      next: () => {
        this.updatingChatAction.set(null);
        this.closeActionsMenu();
        if (!currentlyBlocked) {
          this.stopLocalTyping();
          this.messageDraft.set('');
          this.clearSelectedAttachment();
          this.messagesError.set(null);
          this.blockedByCounterpart.set(false);
        }
        this.loadBlockedUsers();
      },
      error: (error) => {
        this.updatingChatAction.set(null);
        this.chatActionsError.set(
          error?.error?.message || error?.error?.error || 'No se pudo completar la acción de bloqueo.',
        );
      },
    });
  }

  onChatInteraction(): void {
    this.scheduleMarkCurrentChatAsRead(false);
  }

  onMessageDraftChange(value: string): void {
    this.messageDraft.set(value);
    this.scheduleMarkCurrentChatAsRead(false);

    const chatId = this.selectedChatId();
    if (!chatId) {
      return;
    }

    this.handleLocalTyping(chatId, value);
  }

  onAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.isMessagingBlocked()) {
      input.value = '';
      return;
    }

    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    const attachmentType = this.resolveAttachmentType(file);
    if (!attachmentType) {
      this.messagesError.set('Tipo de archivo no soportado para enviar mensaje.');
      input.value = '';
      return;
    }

    this.messagesError.set(null);
    this.selectedAttachment.set(file);
    this.selectedAttachmentType.set(attachmentType);
    this.setAttachmentPreview(file, attachmentType);
    this.scheduleMarkCurrentChatAsRead(false);

    input.value = '';
  }

  clearSelectedAttachment(): void {
    this.selectedAttachment.set(null);
    this.selectedAttachmentType.set(null);
    this.clearAttachmentPreview();
  }

  sendMessage(): void {
    void this.sendMessageAsync();
  }

  private async sendMessageAsync(): Promise<void> {
    const chatId = this.selectedChatId();
    const contenido = this.messageDraft().trim();
    const attachment = this.selectedAttachment();
    const attachmentType = this.selectedAttachmentType();

    if (!chatId || this.sendingMessage() || this.isMessagingBlocked()) {
      return;
    }

    if (!contenido && !attachment) {
      return;
    }

    this.stopLocalTyping();
    this.sendingMessage.set(true);
    this.messagesError.set(null);

    const requests: Observable<MensajeResponse>[] = [];

    if (attachment && attachmentType) {
      requests.push(this.messagesApi.sendFileMessage(chatId, attachmentType, attachment));
    }

    if (contenido) {
      try {
        const cifrado = await this.e2ee.encryptText(chatId, contenido);
        requests.push(this.messagesApi.sendEncryptedTextMessage(chatId, cifrado));
      } catch (error) {
        this.sendingMessage.set(false);
        this.messagesError.set('No se pudo cifrar el mensaje antes de enviarlo.');
        this.debugLog('e2ee.encrypt.error', {
          chatId,
          error: error instanceof Error ? error.message : 'unknown',
        });
        return;
      }
    }

    if (requests.length === 0) {
      this.sendingMessage.set(false);
      return;
    }

    forkJoin(requests)
      .pipe(
        finalize(() => {
          this.sendingMessage.set(false);
        }),
      )
      .subscribe({
        next: (sentMessages) => {
          if (this.selectedChatId() !== chatId) {
            return;
          }

          this.blockedByCounterpart.set(false);
          this.messageDraft.set('');
          this.clearSelectedAttachment();

          this.appendMessages(sentMessages, true);
          this.chatsStore.loadChats();
        },
        error: (error) => {
          if (this.isBlockedSendError(error)) {
            if (this.isIndividualChat() && !this.isCounterpartBlocked()) {
              this.blockedByCounterpart.set(true);
            }
            this.messagesError.set(null);
            return;
          }

          this.messagesError.set(this.resolveApiErrorMessage(error, 'No se pudo enviar el mensaje.'));
        },
      });
  }

  onDraftKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    this.sendMessage();
  }

  onMessagesScroll(event: Event): void {
    this.scheduleMarkCurrentChatAsRead(false);

    const container = event.target as HTMLElement | null;
    if (!container || container.scrollTop > 64) {
      return;
    }

    this.loadOlderMessages();
  }

  formatMessageTime(value: string): string {
    const date = new Date(value);

    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatPresenceLastSeen(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'recientemente';
    }

    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    if (sameDay) {
      return date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isOwnMessage(message: MensajeResponse): boolean {
    return message.remitenteId === this.session.usuarioId();
  }

  getOwnMessageStatus(message: MensajeResponse): OwnMessageStatus | null {
    if (!this.isOwnMessage(message)) {
      return null;
    }

    return this.resolveOwnMessageStatus(message);
  }

  getOwnMessageStatusIcon(message: MensajeResponse): string {
    const status = this.getOwnMessageStatus(message);
    if (status === 'ENVIADO') {
      return 'done';
    }

    return 'done_all';
  }

  getOwnMessageStatusLabel(message: MensajeResponse): string | null {
    const status = this.getOwnMessageStatus(message);
    if (!status) {
      return null;
    }

    if (status === 'VISTO') {
      return 'Visto';
    }

    if (status === 'RECIBIDO') {
      return 'Recibido';
    }

    return 'Enviado';
  }

  isOwnMessageStatusRead(message: MensajeResponse): boolean {
    return this.getOwnMessageStatus(message) === 'VISTO';
  }

  isMediaMessage(message: MensajeResponse): boolean {
    return this.getAttachmentFromMessage(message) !== null;
  }

  isImageMessage(message: MensajeResponse): boolean {
    return ['IMAGEN', 'GIF', 'STICKER'].includes(message.tipo);
  }

  isVideoMessage(message: MensajeResponse): boolean {
    return message.tipo === 'VIDEO';
  }

  isAudioMessage(message: MensajeResponse): boolean {
    return message.tipo === 'AUDIO';
  }

  getMessageText(message: MensajeResponse): string {
    if (message.eliminadoParaTodos) {
      return 'Mensaje eliminado';
    }

    if (message.tipo === 'TEXTO') {
      const payload = message.payload as TextoPayload | null;
      if (payload?.cifrado) {
        return this.decryptedTextByMessageId()[message.id] ?? 'Mensaje cifrado...';
      }

      return payload?.contenido?.trim() || '(sin contenido)';
    }

    const attachment = this.getAttachmentFromMessage(message);
    if (attachment?.nombreOriginal) {
      return attachment.nombreOriginal;
    }

    switch (message.tipo) {
      case 'IMAGEN':
        return 'Imagen';
      case 'VIDEO':
        return 'Video';
      case 'AUDIO':
        return 'Audio';
      case 'DOCUMENTO':
        return 'Documento';
      case 'STICKER':
        return 'Sticker';
      case 'GIF':
        return 'GIF';
      case 'UBICACION':
        return 'Ubicacion';
      default:
        return 'Mensaje';
    }
  }

  getAttachmentPreviewUrl(message: MensajeResponse): string | null {
    const attachment = this.getAttachmentFromMessage(message);
    if (!attachment) {
      return null;
    }

    const resolved = this.temporaryFileUrls()[message.id];
    if (resolved) {
      return resolved;
    }

    if (attachment.thumbnailBase64 && this.isImageMessage(message)) {
      return `data:image/jpeg;base64,${attachment.thumbnailBase64}`;
    }

    return null;
  }

  getAttachmentDownloadUrl(message: MensajeResponse): string | null {
    return this.temporaryFileUrls()[message.id] ?? null;
  }

  isResolvingAttachment(messageId: string): boolean {
    return !!this.resolvingFileUrls()[messageId];
  }

  shouldShowDaySeparator(index: number): boolean {
    const currentMessages = this.messages();
    if (index < 0 || index >= currentMessages.length) {
      return false;
    }

    if (index === 0) {
      return true;
    }

    return (
      this.getDayKey(currentMessages[index].creadoEn) !==
      this.getDayKey(currentMessages[index - 1].creadoEn)
    );
  }

  getDaySeparatorLabel(message: MensajeResponse): string {
    return this.formatDayLabel(new Date(message.creadoEn));
  }

  formatBytes(value: number): string {
    if (value < 1024) {
      return `${value} B`;
    }

    const kb = value / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  private loadMessages(chatId: string): void {
    this.debugLog('loadMessages.start', {
      chatId,
      isMobile: this.isMobile(),
      mobileChatOpen: this.mobileChatOpen(),
    });

    this.loadingMessages.set(true);
    this.loadingOlderMessages.set(false);
    this.messagesError.set(null);
    this.messages.set([]);
    this.hasMoreMessages.set(false);
    this.currentPage = 0;

    this.messagesApi
      .listMessages(chatId, 0, this.pageSize)
      .pipe(
        finalize(() => {
          if (this.selectedChatId() === chatId) {
            this.loadingMessages.set(false);
            this.debugLog('loadMessages.finalize', {
              chatId,
              messagesCount: this.messages().length,
              loadingDetail: this.loadingDetail(),
              loadingMessages: this.loadingMessages(),
            });
            this.tryInitialScrollToBottom(chatId);
          }
        }),
      )
      .subscribe({
        next: (page) => {
          if (this.selectedChatId() !== chatId) {
            return;
          }

          const loadedMessages = [...(page.content ?? [])].reverse();
          this.messages.set(loadedMessages);
          this.currentPage = page.number;
          this.hasMoreMessages.set(!page.last);
          this.resolveEncryptedTexts(loadedMessages);
          this.resolveTemporaryUrls(loadedMessages);
          this.debugLog('loadMessages.success', {
            chatId,
            page: page.number,
            totalLoaded: loadedMessages.length,
            pageLast: page.last,
          });
          this.tryInitialScrollToBottom(chatId);
          this.scheduleMarkCurrentChatAsRead(true);
        },
        error: (error) => {
          if (this.selectedChatId() !== chatId) {
            return;
          }

          this.debugLog('loadMessages.error', {
            chatId,
            error: error?.error?.message || error?.message || 'unknown',
          });
          this.messagesError.set(
            error?.error?.message || error?.error?.error || 'No se pudieron cargar los mensajes.',
          );
        },
      });
  }

  private loadChatConfig(chatId: string): void {
    this.loadingChatConfig.set(true);

    this.chatsApi
      .getConfig(chatId)
      .pipe(
        finalize(() => {
          if (this.selectedChatId() === chatId) {
            this.loadingChatConfig.set(false);
          }
        }),
      )
      .subscribe({
        next: (config) => {
          if (this.selectedChatId() !== chatId) {
            return;
          }

          this.chatConfig.set(config);
        },
      });
  }

  private loadBlockedUsers(): void {
    this.loadingBlockedUsers.set(true);

    this.usersApi
      .getBlockedUsers()
      .pipe(
        finalize(() => {
          this.loadingBlockedUsers.set(false);
        }),
      )
      .subscribe({
        next: (blockedUsers) => {
          const blockedMap = blockedUsers.reduce<Record<string, true>>((accumulator, blockedUser) => {
            accumulator[blockedUser.bloqueadoId] = true;
            return accumulator;
          }, {});

          this.blockedUserIds.set(blockedMap);
        },
      });
  }

  private loadCounterpartUserId(chatId: string): void {
    if (this.selectedChat()?.tipo !== 'INDIVIDUAL') {
      this.counterpartUserId.set(null);
      return;
    }

    const ownUserId = this.session.usuarioId();
    if (!ownUserId) {
      this.counterpartUserId.set(null);
      return;
    }

    this.loadingCounterpart.set(true);

    this.chatsApi
      .listMembers(chatId)
      .pipe(
        finalize(() => {
          if (this.selectedChatId() === chatId) {
            this.loadingCounterpart.set(false);
          }
        }),
      )
      .subscribe({
        next: (members) => {
          if (this.selectedChatId() !== chatId) {
            return;
          }

          this.counterpartUserId.set(this.resolveCounterpartUserId(members, ownUserId));
        },
      });
  }

  private resolveCounterpartUserId(members: ParticipanteResponse[], ownUserId: string): string | null {
    const counterpart = members.find((member) => member.usuarioId !== ownUserId);
    return counterpart?.usuarioId ?? null;
  }

  private applyChatConfigUpdate(action: string, request: ActualizarConfiguracionRequest): void {
    const chatId = this.selectedChatId();
    if (!chatId || this.isActionBusy()) {
      return;
    }

    this.updatingChatAction.set(action);
    this.chatActionsError.set(null);

    this.chatsApi.updateConfig(chatId, request).subscribe({
      next: (updatedConfig) => {
        this.updatingChatAction.set(null);
        this.chatConfig.set(updatedConfig);
        this.closeActionsMenu();
        this.chatsStore.loadChats();
      },
      error: (error) => {
        this.updatingChatAction.set(null);
        this.chatActionsError.set(
          error?.error?.message || error?.error?.error || 'No se pudo actualizar la configuración del chat.',
        );
      },
    });
  }

  private loadOlderMessages(): void {
    const chatId = this.selectedChatId();
    if (!chatId || this.loadingMessages() || this.loadingOlderMessages() || !this.hasMoreMessages()) {
      return;
    }

    const container = this.messagesContainer?.nativeElement;
    const previousHeight = container?.scrollHeight ?? 0;
    const previousTop = container?.scrollTop ?? 0;
    const nextPage = this.currentPage + 1;

    this.loadingOlderMessages.set(true);

    this.messagesApi
      .listMessages(chatId, nextPage, this.pageSize)
      .pipe(
        finalize(() => {
          if (this.selectedChatId() === chatId) {
            this.loadingOlderMessages.set(false);
          }
        }),
      )
      .subscribe({
        next: (page) => {
          if (this.selectedChatId() !== chatId) {
            return;
          }

          const olderMessages = [...(page.content ?? [])].reverse();
          this.currentPage = page.number;
          this.hasMoreMessages.set(!page.last);
          this.messages.update((current) => this.mergeMessages(current, olderMessages));
          this.resolveEncryptedTexts(olderMessages);
          this.resolveTemporaryUrls(olderMessages);
          this.restoreScrollAfterPrepend(previousHeight, previousTop);
        },
      });
  }

  private resolveEncryptedTexts(messages: MensajeResponse[]): void {
    if (messages.length === 0) {
      return;
    }

    const selectedChatId = this.selectedChatId();
    if (!selectedChatId) {
      return;
    }

    const resolved = this.decryptedTextByMessageId();
    for (const message of messages) {
      const payload = this.getEncryptedTextPayload(message);
      if (!payload || resolved[message.id]) {
        continue;
      }

      const chatId = message.conversacionId || selectedChatId;
      void this.e2ee
        .decryptText(chatId, payload)
        .then((plainText) => {
          if (this.selectedChatId() !== selectedChatId) {
            return;
          }

          this.decryptedTextByMessageId.update((current) => ({
            ...current,
            [message.id]: plainText,
          }));
        })
        .catch((error) => {
          if (this.selectedChatId() !== selectedChatId) {
            return;
          }

          this.debugLog('e2ee.decrypt.error', {
            chatId,
            messageId: message.id,
            error: error instanceof Error ? error.message : 'unknown',
          });
          this.decryptedTextByMessageId.update((current) => ({
            ...current,
            [message.id]: 'No se pudo descifrar',
          }));
        });
    }
  }

  private getEncryptedTextPayload(message: MensajeResponse): CifradoPayload | null {
    if (message.tipo !== 'TEXTO' || !message.payload || typeof message.payload !== 'object') {
      return null;
    }

    const payload = message.payload as TextoPayload;
    if (
      !payload.cifrado?.alg ||
      !payload.cifrado.keyId ||
      !payload.cifrado.iv ||
      !payload.cifrado.ciphertext
    ) {
      return null;
    }

    return payload.cifrado;
  }

  private resolveTemporaryUrls(messages: MensajeResponse[]): void {
    messages.forEach((message) => {
      const attachment = this.getAttachmentFromMessage(message);
      if (!attachment?.urlAcceso) {
        return;
      }

      if (this.temporaryFileUrls()[message.id] || this.resolvingFileUrls()[message.id]) {
        return;
      }

      this.patchResolvingFile(message.id, true);

      this.filesApi.resolveTemporaryUrl(attachment.urlAcceso).subscribe({
        next: (url) => {
          this.temporaryFileUrls.update((current) => ({
            ...current,
            [message.id]: url,
          }));
          this.patchResolvingFile(message.id, false);
        },
        error: () => {
          this.patchResolvingFile(message.id, false);
        },
      });
    });
  }

  private patchResolvingFile(messageId: string, value: boolean): void {
    this.resolvingFileUrls.update((current) => {
      if (!value) {
        const { [messageId]: _, ...rest } = current;
        return rest;
      }

      return {
        ...current,
        [messageId]: true,
      };
    });
  }

  private getAttachmentFromMessage(message: MensajeResponse): ArchivoMultimediaResponse | null {
    if (!message.payload || typeof message.payload !== 'object') {
      return null;
    }

    if (!('archivo' in message.payload)) {
      return null;
    }

    const payload = message.payload as MultimediaPayload;
    return payload.archivo ?? null;
  }

  private resolveAttachmentType(file: File): TipoMensajeArchivo | null {
    const mime = file.type.toLowerCase();

    if (mime === 'image/gif') {
      return 'GIF';
    }

    if (mime.startsWith('image/')) {
      return 'IMAGEN';
    }

    if (mime.startsWith('audio/')) {
      return 'AUDIO';
    }

    if (mime.startsWith('video/')) {
      return 'VIDEO';
    }

    const documentTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ]);

    if (documentTypes.has(mime)) {
      return 'DOCUMENTO';
    }

    return null;
  }

  private setAttachmentPreview(file: File, type: TipoMensajeArchivo): void {
    this.clearAttachmentPreview();

    if (!['IMAGEN', 'GIF', 'STICKER'].includes(type)) {
      this.selectedAttachmentPreviewUrl.set(null);
      return;
    }

    this.attachmentPreviewObjectUrl = URL.createObjectURL(file);
    this.selectedAttachmentPreviewUrl.set(this.attachmentPreviewObjectUrl);
  }

  private clearAttachmentPreview(): void {
    if (this.attachmentPreviewObjectUrl) {
      URL.revokeObjectURL(this.attachmentPreviewObjectUrl);
      this.attachmentPreviewObjectUrl = null;
    }

    this.selectedAttachmentPreviewUrl.set(null);
  }

  private updateViewportMode(): void {
    const mobile = window.matchMedia('(max-width: 1023px)').matches;
    const desktopInfoVisible = window.matchMedia('(min-width: 1280px)').matches;
    const previousIsMobile = this.isMobile();
    const previousMobileChatOpen = this.mobileChatOpen();
    const previousDesktopInfoVisible = this.isDesktopInfoVisible();
    this.isMobile.set(mobile);
    this.isDesktopInfoVisible.set(desktopInfoVisible);

    if (!mobile) {
      this.mobileChatOpen.set(false);
    }

    if (
      previousIsMobile !== mobile ||
      previousMobileChatOpen !== this.mobileChatOpen() ||
      previousDesktopInfoVisible !== desktopInfoVisible
    ) {
      this.debugLog('viewport.update', {
        previousIsMobile,
        isMobile: mobile,
        previousMobileChatOpen,
        mobileChatOpen: this.mobileChatOpen(),
        previousDesktopInfoVisible,
        desktopInfoVisible: this.isDesktopInfoVisible(),
      });
    }
  }

  private handleRealtimeEvent(event: WsEventEnvelope<unknown>): void {
    switch (event.tipo) {
      case 'NUEVO_MENSAJE': {
        const liveMessage = this.toMensajeResponse(event.payload);
        if (!liveMessage) {
          return;
        }

        if (liveMessage.conversacionId === this.selectedChatId()) {
          this.appendMessages([liveMessage], false);
          this.scheduleMarkCurrentChatAsRead(false);
        }

        this.chatsStore.loadChats();
        return;
      }
      case 'ESCRIBIENDO': {
        const payload = this.toEscribiendoPayload(event.payload);
        if (!payload) {
          return;
        }

        this.handleRemoteTyping(payload);
        return;
      }
      case 'DEJO_DE_ESCRIBIR': {
        const payload = this.toEscribiendoPayload(event.payload);
        if (!payload) {
          return;
        }

        this.removeRemoteTyping(payload.conversacionId, payload.usuarioId);
        return;
      }
      case 'ESTADO_ENTREGA': {
        const payload = this.toEstadoEntregaPayload(event.payload);
        if (!payload) {
          return;
        }

        this.applyDeliveryEvent(payload);
        return;
      }
      case 'PRESENCIA': {
        const payload = this.toPresenciaPayload(event.payload);
        if (!payload) {
          return;
        }

        this.applyPresenceEvent(payload);
        return;
      }
      default:
        return;
    }
  }

  private toMensajeResponse(payload: unknown): MensajeResponse | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const message = payload as Partial<MensajeResponse>;
    if (
      typeof message.id !== 'string' ||
      typeof message.conversacionId !== 'string' ||
      typeof message.remitenteId !== 'string' ||
      typeof message.tipo !== 'string' ||
      typeof message.creadoEn !== 'string'
    ) {
      return null;
    }

    return message as MensajeResponse;
  }

  private toEscribiendoPayload(payload: unknown): EscribiendoWsPayload | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const typingPayload = payload as Partial<EscribiendoWsPayload>;
    if (
      typeof typingPayload.conversacionId !== 'string' ||
      typeof typingPayload.usuarioId !== 'string' ||
      typeof typingPayload.username !== 'string'
    ) {
      return null;
    }

    return typingPayload as EscribiendoWsPayload;
  }

  private toEstadoEntregaPayload(payload: unknown): EstadoEntregaWsPayload | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const deliveryPayload = payload as Partial<EstadoEntregaWsPayload>;
    if (
      typeof deliveryPayload.mensajeId !== 'string' ||
      typeof deliveryPayload.conversacionId !== 'string' ||
      typeof deliveryPayload.usuarioId !== 'string'
    ) {
      return null;
    }

    return {
      mensajeId: deliveryPayload.mensajeId,
      conversacionId: deliveryPayload.conversacionId,
      usuarioId: deliveryPayload.usuarioId,
      entregadoEn: typeof deliveryPayload.entregadoEn === 'string' ? deliveryPayload.entregadoEn : null,
      leidoEn: typeof deliveryPayload.leidoEn === 'string' ? deliveryPayload.leidoEn : null,
    };
  }

  private toPresenciaPayload(payload: unknown): PresenciaWsPayload | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const presencePayload = payload as Partial<PresenciaWsPayload>;
    if (
      typeof presencePayload.usuarioId !== 'string' ||
      typeof presencePayload.username !== 'string' ||
      typeof presencePayload.conectado !== 'boolean'
    ) {
      return null;
    }

    return {
      usuarioId: presencePayload.usuarioId,
      username: presencePayload.username,
      conectado: presencePayload.conectado,
      ultimoVisto: typeof presencePayload.ultimoVisto === 'string' ? presencePayload.ultimoVisto : null,
    };
  }

  private handleRemoteTyping(payload: EscribiendoWsPayload): void {
    if (payload.usuarioId === this.session.usuarioId()) {
      return;
    }

    this.typingUsersByChat.update((current) => {
      const currentChatTyping = current[payload.conversacionId] ?? {};

      return {
        ...current,
        [payload.conversacionId]: {
          ...currentChatTyping,
          [payload.usuarioId]: payload.username,
        },
      };
    });

    const timeoutKey = `${payload.conversacionId}:${payload.usuarioId}`;
    const existingTimer = this.remoteTypingTimeouts.get(timeoutKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timeout = setTimeout(() => {
      this.removeRemoteTyping(payload.conversacionId, payload.usuarioId);
    }, 3500);

    this.remoteTypingTimeouts.set(timeoutKey, timeout);
  }

  private removeRemoteTyping(chatId: string, usuarioId: string): void {
    const timeoutKey = `${chatId}:${usuarioId}`;
    const timer = this.remoteTypingTimeouts.get(timeoutKey);
    if (timer) {
      clearTimeout(timer);
      this.remoteTypingTimeouts.delete(timeoutKey);
    }

    this.typingUsersByChat.update((current) => {
      const currentChatTyping = current[chatId];
      if (!currentChatTyping || !(usuarioId in currentChatTyping)) {
        return current;
      }

      const { [usuarioId]: _, ...remainingUsers } = currentChatTyping;
      if (Object.keys(remainingUsers).length === 0) {
        const { [chatId]: __, ...remainingChats } = current;
        return remainingChats;
      }

      return {
        ...current,
        [chatId]: remainingUsers,
      };
    });
  }

  private clearRemoteTypingUsers(): void {
    this.remoteTypingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.remoteTypingTimeouts.clear();
    this.typingUsersByChat.set({});
  }

  private buildTypingLabel(users: string[]): string | null {
    if (users.length === 0) {
      return null;
    }

    if (users.length === 1) {
      return `${users[0]} escribiendo...`;
    }

    if (users.length === 2) {
      return `${users[0]} y ${users[1]} escribiendo...`;
    }

    return 'Varios usuarios escribiendo...';
  }

  private applyPresenceEvent(payload: PresenciaWsPayload): void {
    this.debugLog('presence.event', {
      usuarioId: payload.usuarioId,
      conectado: payload.conectado,
      ultimoVisto: payload.ultimoVisto,
      selectedChatId: this.selectedChatId(),
      counterpartUserId: this.counterpartUserId(),
    });

    this.presenceByUser.update((current) => ({
      ...current,
      [payload.usuarioId]: payload,
    }));
  }

  private applyDeliveryEvent(payload: EstadoEntregaWsPayload): void {
    if (payload.conversacionId !== this.selectedChatId()) {
      return;
    }

    this.deliveryOverrides.update((current) => {
      const messageOverrides = current[payload.mensajeId] ?? {};
      const previous = messageOverrides[payload.usuarioId] ?? { entregadoEn: null, leidoEn: null };

      return {
        ...current,
        [payload.mensajeId]: {
          ...messageOverrides,
          [payload.usuarioId]: {
            entregadoEn: payload.entregadoEn ?? previous.entregadoEn,
            leidoEn: payload.leidoEn ?? previous.leidoEn,
          },
        },
      };
    });
  }

  private handleLocalTyping(chatId: string, draft: string): void {
    if (draft.trim().length === 0) {
      this.stopLocalTyping();
      return;
    }

    const now = Date.now();
    const shouldSendTyping = this.localTypingChatId !== chatId || now - this.lastTypingSentAt >= 1200;
    if (shouldSendTyping) {
      this.realtime.sendTyping(chatId);
      this.localTypingChatId = chatId;
      this.lastTypingSentAt = now;
    }

    if (this.localTypingStopTimeout) {
      clearTimeout(this.localTypingStopTimeout);
    }

    this.localTypingStopTimeout = setTimeout(() => {
      this.stopLocalTyping();
    }, 1800);
  }

  private stopLocalTyping(): void {
    if (this.localTypingStopTimeout) {
      clearTimeout(this.localTypingStopTimeout);
      this.localTypingStopTimeout = null;
    }

    if (this.localTypingChatId) {
      this.realtime.sendStoppedTyping(this.localTypingChatId);
      this.localTypingChatId = null;
    }
  }

  private scheduleMarkCurrentChatAsRead(force: boolean): void {
    const chatId = this.selectedChatId();
    const visible = this.isSelectedChatVisible();
    if (!chatId || this.loadingDetail() || !this.selectedChat() || !visible) {
      this.debugLog('read.schedule.skip', {
        force,
        chatId,
        loadingDetail: this.loadingDetail(),
        hasSelectedChat: !!this.selectedChat(),
        visible,
        isMobile: this.isMobile(),
        mobileChatOpen: this.mobileChatOpen(),
      });
      return;
    }

    if (force) {
      if (this.pendingReadMarkTimeout) {
        clearTimeout(this.pendingReadMarkTimeout);
        this.pendingReadMarkTimeout = null;
      }

      this.debugLog('read.schedule.force', { chatId });
      this.markCurrentChatAsRead(true);
      return;
    }

    if (this.pendingReadMarkTimeout) {
      return;
    }

    this.pendingReadMarkTimeout = setTimeout(() => {
      this.pendingReadMarkTimeout = null;
      this.debugLog('read.schedule.debounced', { chatId });
      this.markCurrentChatAsRead(false);
    }, 120);
  }

  private markCurrentChatAsRead(force: boolean): void {
    if (document.hidden) {
      this.debugLog('read.mark.skip.hidden', { force, chatId: this.selectedChatId() });
      return;
    }

    if (!this.isSelectedChatVisible()) {
      this.debugLog('read.mark.skip.notVisible', {
        force,
        chatId: this.selectedChatId(),
        isMobile: this.isMobile(),
        mobileChatOpen: this.mobileChatOpen(),
      });
      return;
    }

    const chatId = this.selectedChatId();
    if (!chatId) {
      this.debugLog('read.mark.skip.noChat', { force });
      return;
    }

    this.debugLog('read.mark.send', { force, chatId });
    this.chatsStore.markChatAsRead(chatId, force);
  }

  private isSelectedChatVisible(): boolean {
    if (!this.selectedChat()) {
      return false;
    }

    if (!this.isMobile()) {
      return true;
    }

    return this.mobileChatOpen();
  }

  private resolveOwnMessageStatus(message: MensajeResponse): OwnMessageStatus {
    const combinedStates = this.resolveCombinedDeliveryStates(message);
    if (combinedStates.length === 0) {
      return 'ENVIADO';
    }

    const deliveredForAll = combinedStates.every((state) => !!(state.entregadoEn || state.leidoEn));
    const readForAll = combinedStates.every((state) => !!state.leidoEn);

    if (readForAll && this.readReceiptsEnabled()) {
      return 'VISTO';
    }

    if (deliveredForAll || readForAll) {
      return 'RECIBIDO';
    }

    return 'ENVIADO';
  }

  private resolveCombinedDeliveryStates(message: MensajeResponse): EstadoMensajeResponse[] {
    const byUser = new Map<string, EstadoMensajeResponse>();

    for (const state of message.estados ?? []) {
      if (!state?.usuarioId) {
        continue;
      }

      byUser.set(state.usuarioId, {
        usuarioId: state.usuarioId,
        entregadoEn: state.entregadoEn ?? null,
        leidoEn: state.leidoEn ?? null,
      });
    }

    const overridesByUser = this.deliveryOverrides()[message.id] ?? {};
    for (const [usuarioId, override] of Object.entries(overridesByUser)) {
      const previous = byUser.get(usuarioId) ?? {
        usuarioId,
        entregadoEn: null,
        leidoEn: null,
      };

      byUser.set(usuarioId, {
        usuarioId,
        entregadoEn: override.entregadoEn ?? previous.entregadoEn,
        leidoEn: override.leidoEn ?? previous.leidoEn,
      });
    }

    return Array.from(byUser.values());
  }

  private appendMessages(incoming: MensajeResponse[], forceScrollToBottom: boolean): void {
    if (incoming.length === 0) {
      return;
    }

    const shouldAutoScroll = forceScrollToBottom || this.isNearBottom();
    this.messages.update((current) => this.mergeMessages(current, incoming));
    this.resolveEncryptedTexts(incoming);
    this.resolveTemporaryUrls(incoming);

    if (shouldAutoScroll) {
      this.scrollToBottomSoon();
    }
  }

  private mergeMessages(current: MensajeResponse[], incoming: MensajeResponse[]): MensajeResponse[] {
    const byId = new Map<string, MensajeResponse>();

    for (const message of current) {
      byId.set(message.id, message);
    }

    for (const message of incoming) {
      const existing = byId.get(message.id);
      if (!existing) {
        byId.set(message.id, message);
        continue;
      }

      byId.set(message.id, {
        ...existing,
        ...message,
        estados: message.estados ?? existing.estados ?? null,
      });
    }

    return Array.from(byId.values()).sort((a, b) => this.compareMessages(a, b));
  }

  private compareMessages(a: MensajeResponse, b: MensajeResponse): number {
    const createdDiff = new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime();
    if (createdDiff !== 0) {
      return createdDiff;
    }

    return a.id.localeCompare(b.id);
  }

  private isNearBottom(): boolean {
    const container = this.messagesContainer?.nativeElement;
    if (!container) {
      return true;
    }

    const threshold = 120;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceToBottom <= threshold;
  }

  private scrollToBottomSoon(): void {
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        const container = this.messagesContainer?.nativeElement;
        if (!container) {
          return;
        }

        container.scrollTop = container.scrollHeight;
      });
    });
  }

  private tryInitialScrollToBottom(chatId: string, retries = 8): void {
    if (this.pendingInitialScrollChatId !== chatId) {
      this.debugLog('scroll.initial.skip.pendingMismatch', {
        chatId,
        pendingInitialScrollChatId: this.pendingInitialScrollChatId,
      });
      return;
    }

    this.debugLog('scroll.initial.start', {
      chatId,
      retries,
      isMobile: this.isMobile(),
      mobileChatOpen: this.mobileChatOpen(),
    });

    const attempt = (remaining: number): void => {
      if (this.pendingInitialScrollChatId !== chatId || this.selectedChatId() !== chatId) {
        this.debugLog('scroll.initial.stop.chatChanged', {
          chatId,
          pendingInitialScrollChatId: this.pendingInitialScrollChatId,
          selectedChatId: this.selectedChatId(),
        });
        return;
      }

      const container = this.messagesContainer?.nativeElement;
      const notReady = this.loadingDetail() || this.loadingMessages() || !container;

      if (notReady) {
        if (remaining > 0) {
          setTimeout(() => attempt(remaining - 1), 35);
        }

        if (remaining === retries || remaining <= 1) {
          this.debugLog('scroll.initial.waiting', {
            chatId,
            remaining,
            loadingDetail: this.loadingDetail(),
            loadingMessages: this.loadingMessages(),
            hasContainer: !!container,
            isMobile: this.isMobile(),
            mobileChatOpen: this.mobileChatOpen(),
          });
        }
        return;
      }

      this.debugLog('scroll.initial.apply.before', {
        chatId,
        remaining,
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
      });
      container.scrollTop = container.scrollHeight;
      this.debugLog('scroll.initial.apply.after', {
        chatId,
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
      });
      this.pendingInitialScrollChatId = null;
    };

    queueMicrotask(() => {
      requestAnimationFrame(() => {
        attempt(retries);
      });
    });
  }

  private restoreScrollAfterPrepend(previousHeight: number, previousTop: number): void {
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        const container = this.messagesContainer?.nativeElement;
        if (!container) {
          return;
        }

        const newHeight = container.scrollHeight;
        container.scrollTop = newHeight - previousHeight + previousTop;
      });
    });
  }

  private getDayKey(value: string): string {
    const date = new Date(value);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  private formatDayLabel(date: Date): string {
    const todayStart = this.startOfDay(new Date());
    const dateStart = this.startOfDay(date);
    const diffDays = Math.round((todayStart.getTime() - dateStart.getTime()) / 86400000);

    if (diffDays === 0) {
      return 'Hoy';
    }

    if (diffDays === 1) {
      return 'Ayer';
    }

    if (diffDays > 1 && diffDays < 7) {
      return this.capitalizeFirst(date.toLocaleDateString('es-CO', { weekday: 'long' }));
    }

    if (date.getFullYear() === todayStart.getFullYear()) {
      return this.capitalizeFirst(
        date.toLocaleDateString('es-CO', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }),
      );
    }

    return this.capitalizeFirst(
      date.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    );
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private capitalizeFirst(value: string): string {
    if (!value) {
      return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private formatLocalDateTime(value: Date): string {
    const paddedMonth = `${value.getMonth() + 1}`.padStart(2, '0');
    const paddedDay = `${value.getDate()}`.padStart(2, '0');
    const paddedHour = `${value.getHours()}`.padStart(2, '0');
    const paddedMinute = `${value.getMinutes()}`.padStart(2, '0');
    const paddedSecond = `${value.getSeconds()}`.padStart(2, '0');

    return `${value.getFullYear()}-${paddedMonth}-${paddedDay}T${paddedHour}:${paddedMinute}:${paddedSecond}`;
  }

  private isWithinLastDays(value: Date, days: number): boolean {
    if (Number.isNaN(value.getTime())) {
      return false;
    }

    const diffMs = Date.now() - value.getTime();
    return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
  }

  private getSelectedChatBackgroundPreset(): ChatBackgroundPreset {
    const chatId = this.selectedChatId();
    if (!chatId) {
      return 'ocean';
    }

    return this.chatBackgroundsByChat()[chatId] ?? 'ocean';
  }

  private loadStoredChatBackgrounds(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(this.chatBackgroundStorageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, string>;
      if (!parsed || typeof parsed !== 'object') {
        return;
      }

      const allowed = new Set<ChatBackgroundPreset>(['ocean', 'sunset', 'forest', 'slate']);
      const sanitized = Object.entries(parsed).reduce<Record<string, ChatBackgroundPreset>>(
        (accumulator, [chatId, preset]) => {
          if (!allowed.has(preset as ChatBackgroundPreset)) {
            return accumulator;
          }

          accumulator[chatId] = preset as ChatBackgroundPreset;
          return accumulator;
        },
        {},
      );

      this.chatBackgroundsByChat.set(sanitized);
    } catch {
      this.chatBackgroundsByChat.set({});
    }
  }

  private persistChatBackgrounds(value: Record<string, ChatBackgroundPreset>): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(this.chatBackgroundStorageKey, JSON.stringify(value));
  }

  private isBlockedSendError(error: unknown): boolean {
    const status = (error as { status?: number })?.status;
    const message = this.resolveApiErrorMessage(error, '').toLowerCase();

    if (message.includes('no puedes enviar mensajes a este usuario')) {
      return true;
    }

    if (message.includes('bloque')) {
      return true;
    }

    return status === 403 && this.isIndividualChat();
  }

  private resolveApiErrorMessage(error: unknown, fallback: string): string {
    const source = error as {
      error?: {
        message?: string;
        error?: string;
      };
      message?: string;
    };

    return source?.error?.message || source?.error?.error || source?.message || fallback;
  }

  private debugLog(event: string, context?: Record<string, unknown>): void {
    if (!this.debugLogsEnabled) {
      return;
    }

    const now = new Date().toISOString();
    if (context) {
      console.debug(`[MessengerDebug][${now}] ${event}`, context);
      return;
    }

    console.debug(`[MessengerDebug][${now}] ${event}`);
  }
}
