import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ChatView } from '../../models/chat.model';

@Component({
  selector: 'app-chat-list-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-list-item.component.html',
  styleUrl: './chat-list-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatListItemComponent {
  readonly chat = input.required<ChatView>();
  readonly selected = input(false);

  readonly openChat = output<string>();

  readonly initials = computed(() => {
    const title = this.chat().titulo?.trim() || 'Chat';
    const parts = title.split(/\s+/);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  });

  readonly formattedTime = computed(() => {
    const value = this.chat().ultimoMensajeFecha || this.chat().creadaEn;

    if (!value) {
      return '';
    }

    const date = new Date(value);
    const today = new Date();

    const sameDay =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    if (sameDay) {
      return date.toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return date.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
    });
  });

  select(): void {
    this.openChat.emit(this.chat().id);
  }
}
