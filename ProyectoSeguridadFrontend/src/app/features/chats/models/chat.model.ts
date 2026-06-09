export type TipoConversacion = 'INDIVIDUAL' | 'GRUPO';

export type RolParticipante = 'ADMIN' | 'MIEMBRO';

export type ChatListFilter = 'TODOS' | 'NO_LEIDOS' | 'GRUPOS' | 'ARCHIVADOS';

export type TipoMensaje =
  | 'TEXTO'
  | 'IMAGEN'
  | 'AUDIO'
  | 'VIDEO'
  | 'DOCUMENTO'
  | 'STICKER'
  | 'GIF'
  | 'UBICACION';

export interface UltimoMensajeResponse {
  id: string;
  remitenteId: string;
  remitenteUsername: string;
  tipo: TipoMensaje;
  preview: string;
  creadoEn: string;
  eliminado: boolean;
}

export interface ChatResumenResponse {
  id: string;
  tipo: TipoConversacion;
  titulo: string;
  urlAvatar?: string | null;
  creadaEn: string;
  esAdmin: boolean;
  ultimoMensaje?: UltimoMensajeResponse | null;
  contactoId?: string | null;
  noLeidos: number;
}

export interface ConversacionResponse {
  id: string;
  tipo: TipoConversacion;
  titulo: string;
  urlAvatar?: string | null;
  creadaEn: string;
  esAdmin: boolean;
  totalMiembros: number;
}

export interface CrearChatIndividualRequest {
  destinatarioId: string;
}

export interface CrearGrupoRequest {
  titulo: string;
  avatar?: File | null;
  miembrosIds: string[];
}

export interface ParticipanteResponse {
  usuarioId: string;
  username: string;
  nombreCompleto: string;
  urlAvatar?: string | null;
  rol: RolParticipante;
  fechaUnion: string;
}

export interface AgregarMiembrosRequest {
  usuarioIds: string[];
}

export interface ConfiguracionChatResponse {
  silenciado: boolean;
  silenciadoHasta?: string | null;
  archivado: boolean;
  fijado: boolean;
}

export interface ActualizarConfiguracionRequest {
  silenciadoHasta?: string | null;
  archivado?: boolean | null;
  fijado?: boolean | null;
}

export interface ChatView {
  id: string;
  tipo: TipoConversacion;
  titulo: string;
  avatarUrl?: string | null;
  creadaEn: string;
  esAdmin: boolean;
  archivado: boolean;
  noLeidos: number;
  ultimoMensajeTexto: string;
  ultimoMensajeFecha?: string | null;
  ultimoMensajeTipo?: TipoMensaje | null;
  escribiendo?: boolean;
  fijado?: boolean;
  silenciado?: boolean;
  counterpartId?: string | null;
  counterpartOnline?: boolean;
  counterpartLastSeen?: string | null;
}

export interface ChatFilterOption {
  key: ChatListFilter;
  label: string;
  count: number;
}
