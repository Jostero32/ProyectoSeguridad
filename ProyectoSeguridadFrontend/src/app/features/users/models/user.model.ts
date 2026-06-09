export type PrivacidadUltimoVisto = 'TODOS' | 'NADIE';

export interface PerfilResponse {
  id: string;
  username: string;
  nombres: string;
  apellidos: string;
  urlAvatar?: string | null;
  bio?: string | null;
  ultimoVisto?: string | null;
  privacidadUltimoVisto?: PrivacidadUltimoVisto | null;
}

export interface BloqueoResponse {
  bloqueadoId: string;
  username: string;
  nombreCompleto: string;
  urlAvatar?: string | null;
  fechaBloqueo: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
