export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuarioId: string;
}

export interface RegistroRequest {
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  username: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface SesionResponse {
  id: string;
  infoDispositivo: string;
  ultimoAcceso: string;
  plataformaPush?: string | null;
}

export interface ErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
}
