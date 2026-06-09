import { TipoMensaje } from './chat.model';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export type E2eeAlgorithm = 'AES_GCM' | 'DES_CBC' | 'CHACHA20';

export interface CifradoPayload {
  alg: E2eeAlgorithm | string;
  keyId: string;
  iv: string;
  ciphertext: string;
}

export interface TextoPayload {
  contenido: string | null;
  cifrado?: CifradoPayload | null;
}

export interface ArchivoMultimediaResponse {
  urlAcceso: string;
  nombreOriginal: string;
  contentType: string;
  tamanioBytes: number;
  thumbnailBase64: string | null;
}

export type TipoMensajeArchivo = Extract<
  TipoMensaje,
  'IMAGEN' | 'AUDIO' | 'VIDEO' | 'DOCUMENTO' | 'STICKER' | 'GIF'
>;

export interface MultimediaPayload {
  archivo: ArchivoMultimediaResponse | null;
}

export interface UbicacionResponse {
  latitud: number;
  longitud: number;
  nombreLugar: string | null;
}

export interface UbicacionPayload {
  ubicacion: UbicacionResponse | null;
}

export type MensajePayload = TextoPayload | MultimediaPayload | UbicacionPayload | null;

export interface EstadoMensajeResponse {
  usuarioId: string;
  entregadoEn: string | null;
  leidoEn: string | null;
}

export interface MensajeResponse {
  id: string;
  conversacionId: string;
  remitenteId: string;
  tipo: TipoMensaje;
  creadoEn: string;
  editadoEn: string | null;
  eliminado: boolean;
  eliminadoParaTodos: boolean;
  estados?: EstadoMensajeResponse[] | null;
  payload: MensajePayload;
}

export interface PresignedUrlResponse {
  url: string;
  expiresInSeconds: number;
}
