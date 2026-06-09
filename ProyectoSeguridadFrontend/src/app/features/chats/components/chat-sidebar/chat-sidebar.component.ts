import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ChatFilterOption, ChatListFilter, ChatView } from '../../models/chat.model';
import { ChatListItemComponent } from '../chat-list-item/chat-list-item.component';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatListItemComponent],
  templateUrl: './chat-sidebar.component.html',
  styleUrl: './chat-sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatSidebarComponent {
  readonly chats = input.required<ChatView[]>();
  readonly selectedChatId = input<string | null>(null);
  readonly loading = input(false);
  readonly totalUnread = input(0);
  readonly searchTerm = input('');
  readonly activeFilter = input<ChatListFilter>('TODOS');
  readonly filters = input<ChatFilterOption[]>([]);

  readonly searchChange = output<string>();
  readonly filterChange = output<ChatListFilter>();
  readonly openChat = output<string>();
  readonly openNewChat = output<void>();
  readonly openProfile = output<void>();
  readonly refresh = output<void>();

  onSearch(value: string): void {
    this.searchChange.emit(value);
  }

  selectFilter(filter: ChatListFilter): void {
    this.filterChange.emit(filter);
  }

  clearSearch(): void {
    this.searchChange.emit('');
  }
}
