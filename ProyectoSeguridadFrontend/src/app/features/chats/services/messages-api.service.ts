import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../../../config/api.config';
import {
  CifradoPayload,
  MensajeResponse,
  PageResponse,
  TipoMensajeArchivo,
} from '../models/message.model';

@Injectable({
  providedIn: 'root',
})
export class MessagesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_CONFIG.baseUrl;

  listMessages(chatId: string, page = 0, size = 30): Observable<PageResponse<MensajeResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);

    return this.http.get<PageResponse<MensajeResponse>>(
      `${this.baseUrl}${API_CONFIG.endpoints.messages.list(chatId)}`,
      { params },
    );
  }

  sendTextMessage(chatId: string, contenido: string): Observable<MensajeResponse> {
    return this.sendMultipartMessage(chatId, {
      tipo: 'TEXTO',
      contenido,
    });
  }

  sendEncryptedTextMessage(chatId: string, cifrado: CifradoPayload): Observable<MensajeResponse> {
    return this.sendMultipartMessage(chatId, {
      tipo: 'TEXTO',
      cifrado,
    });
  }

  sendFileMessage(chatId: string, tipo: TipoMensajeArchivo, archivo: File): Observable<MensajeResponse> {
    return this.sendMultipartMessage(chatId, {
      tipo,
      archivo,
    });
  }

  private sendMultipartMessage(
    chatId: string,
    data: {
      tipo: string;
      contenido?: string;
      cifrado?: CifradoPayload;
      archivo?: File;
    },
  ): Observable<MensajeResponse> {
    const formData = new FormData();

    formData.append('tipo', data.tipo);

    if (data.contenido !== undefined) {
      formData.append('contenido', data.contenido);
    }

    if (data.cifrado) {
      formData.append('cifradoAlg', data.cifrado.alg);
      formData.append('cifradoKeyId', data.cifrado.keyId);
      formData.append('cifradoIv', data.cifrado.iv);
      formData.append('contenidoCifrado', data.cifrado.ciphertext);
    }

    if (data.archivo) {
      formData.append('archivo', data.archivo);
    }

    return this.http.post<MensajeResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.messages.send(chatId)}`,
      formData,
    );
  }
}
