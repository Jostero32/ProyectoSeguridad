import { Injectable, inject } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { WsCryptoService } from '../../../core/crypto/ws-crypto.service';

export interface WsEventEnvelope<T = unknown> {
  tipo: string;
  payload: T;
}

@Injectable({
  providedIn: 'root',
})
export class ChatRealtimeService {
  private readonly session = inject(AuthSessionService);
  private readonly wsCrypto = inject(WsCryptoService);

  private readonly eventsSubject = new Subject<WsEventEnvelope<unknown>>();
  readonly events$: Observable<WsEventEnvelope<unknown>> = this.eventsSubject.asObservable();

  private client: Client | null = null;
  private eventsSubscription: StompSubscription | null = null;

  private presenceSharingEnabled = true;
  private presenceHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private readonly presenceHeartbeatIntervalMs = 25_000;

  connect(): void {
    if (this.client?.active || this.client?.connected) {
      return;
    }

    const authHeader = this.session.getAuthorizationHeader();
    if (!authHeader) {
      return;
    }

    const client = new Client({
      brokerURL: environment.wsUrl,
      connectHeaders: {
        Authorization: authHeader,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {
        // Intentionally muted to avoid noisy logs in the browser console.
      },
      onConnect: () => {
        this.subscribeToUserEvents(client);
        if (this.presenceSharingEnabled) {
          this.sendPresencePing();
          this.startPresenceHeartbeat();
        } else {
          this.sendPresenceVisibility(false);
          this.stopPresenceHeartbeat();
        }
      },
      onWebSocketClose: () => {
        this.eventsSubscription = null;
        this.stopPresenceHeartbeat();
      },
    });

    this.client = client;
    client.activate();
  }

  disconnect(): void {
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
    this.stopPresenceHeartbeat();

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }

  setPresenceSharingEnabled(enabled: boolean): void {
    this.presenceSharingEnabled = enabled;

    if (!this.client?.connected) {
      return;
    }

    if (enabled) {
      this.sendPresencePing();
      this.startPresenceHeartbeat();
      return;
    }

    this.sendPresenceVisibility(false);
    this.stopPresenceHeartbeat();
  }

  sendTyping(chatId: string): void {
    this.publishToAppDestination('/app/escribiendo', { conversacionId: chatId });
  }

  sendStoppedTyping(chatId: string): void {
    this.publishToAppDestination('/app/dejo-de-escribir', { conversacionId: chatId });
  }

  sendPresencePing(): void {
    if (!this.presenceSharingEnabled) {
      return;
    }

    this.sendPresenceVisibility(true);
  }

  private subscribeToUserEvents(client: Client): void {
    this.eventsSubscription?.unsubscribe();

    this.eventsSubscription = client.subscribe('/user/queue/eventos', (frame: IMessage) => {
      void this.parseEvent(frame.body).then((parsed) => {
        if (!parsed) {
          return;
        }

        this.eventsSubject.next(parsed);
      });
    });
  }

  private startPresenceHeartbeat(): void {
    if (this.presenceHeartbeatTimer) {
      return;
    }

    this.presenceHeartbeatTimer = setInterval(() => {
      if (!this.presenceSharingEnabled) {
        return;
      }

      this.sendPresencePing();
    }, this.presenceHeartbeatIntervalMs);
  }

  private stopPresenceHeartbeat(): void {
    if (!this.presenceHeartbeatTimer) {
      return;
    }

    clearInterval(this.presenceHeartbeatTimer);
    this.presenceHeartbeatTimer = null;
  }

  private sendPresenceVisibility(visible: boolean): void {
    this.publishToAppDestination('/app/presencia/ping', { visible });
  }

  private publishToAppDestination(destination: string, payload: unknown): void {
    if (!this.client?.connected) {
      return;
    }

    void this.wsCrypto
      .encryptValue(payload)
      .then((encryptedPayload) => {
        if (!this.client?.connected) {
          return;
        }

        this.client.publish({
          destination,
          body: JSON.stringify(encryptedPayload),
        });
      })
      .catch(() => {
        // If encryption fails, do not fall back to plaintext STOMP frames.
      });
  }

  private async parseEvent(rawBody: string): Promise<WsEventEnvelope<unknown> | null> {
    try {
      const parsedBody = JSON.parse(rawBody) as unknown;
      const decryptedBody = this.wsCrypto.isEnvelope(parsedBody)
        ? await this.wsCrypto.decryptEnvelope(parsedBody)
        : parsedBody;
      const event = decryptedBody as Partial<WsEventEnvelope<unknown>>;

      if (!event || typeof event.tipo !== 'string') {
        return null;
      }

      return {
        tipo: event.tipo,
        payload: event.payload,
      };
    } catch {
      return null;
    }
  }
}
