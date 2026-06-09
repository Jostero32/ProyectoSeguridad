import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../../../config/api.config';
import {
  ActualizarConfiguracionRequest,
  AgregarMiembrosRequest,
  ChatResumenResponse,
  ConfiguracionChatResponse,
  ConversacionResponse,
  CrearChatIndividualRequest,
  CrearGrupoRequest,
  ParticipanteResponse,
} from '../models/chat.model';

@Injectable({
  providedIn: 'root',
})
export class ChatsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_CONFIG.baseUrl;

  listChats(incluirArchivadas = false): Observable<ChatResumenResponse[]> {
    const params = new HttpParams().set('incluirArchivadas', incluirArchivadas);

    return this.http.get<ChatResumenResponse[]>(
      `${this.baseUrl}${API_CONFIG.endpoints.chats.list}`,
      { params },
    );
  }

  getChatById(id: string): Observable<ConversacionResponse> {
    return this.http.get<ConversacionResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.chats.byId(id)}`,
    );
  }

  createOrGetIndividualChat(request: CrearChatIndividualRequest): Observable<ConversacionResponse> {
    return this.http.post<ConversacionResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.chats.individual}`,
      request,
    );
  }

  createGroup(request: CrearGrupoRequest): Observable<ConversacionResponse> {
    const formData = new FormData();

    formData.append('titulo', request.titulo);
    formData.append('miembrosIds', JSON.stringify(request.miembrosIds));

    if (request.avatar) {
      formData.append('avatar', request.avatar);
    }

    return this.http.post<ConversacionResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.chats.group}`,
      formData,
    );
  }

  updateGroup(
    chatId: string,
    data: {
      titulo?: string | null;
      avatar?: File | null;
    },
  ): Observable<ConversacionResponse> {
    const formData = new FormData();

    if (data.titulo !== undefined && data.titulo !== null) {
      formData.append('titulo', data.titulo);
    }

    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    return this.http.patch<ConversacionResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.chats.byId(chatId)}`,
      formData,
    );
  }

  deleteGroup(chatId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${API_CONFIG.endpoints.chats.byId(chatId)}`);
  }

  markAsRead(chatId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}${API_CONFIG.endpoints.chats.read(chatId)}`, {});
  }

  getConfig(chatId: string): Observable<ConfiguracionChatResponse> {
    return this.http.get<ConfiguracionChatResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.chats.config(chatId)}`,
    );
  }

  updateConfig(
    chatId: string,
    request: ActualizarConfiguracionRequest,
  ): Observable<ConfiguracionChatResponse> {
    return this.http.put<ConfiguracionChatResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.chats.config(chatId)}`,
      request,
    );
  }

  listMembers(chatId: string): Observable<ParticipanteResponse[]> {
    return this.http.get<ParticipanteResponse[]>(
      `${this.baseUrl}${API_CONFIG.endpoints.chats.members(chatId)}`,
    );
  }

  addMembers(chatId: string, request: AgregarMiembrosRequest): Observable<ParticipanteResponse[]> {
    return this.http.post<ParticipanteResponse[]>(
      `${this.baseUrl}${API_CONFIG.endpoints.chats.members(chatId)}`,
      request,
    );
  }

  removeMember(chatId: string, usuarioId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}${API_CONFIG.endpoints.chats.members(chatId)}/${usuarioId}`,
    );
  }

  leaveGroup(chatId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}${API_CONFIG.endpoints.chats.members(chatId)}/me`,
    );
  }
}
