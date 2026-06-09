import { environment } from '../../environments/environment';

export const API_CONFIG = {
  baseUrl: environment.apiBaseUrl,
  wsUrl: environment.wsUrl,
  sockJsUrl: environment.sockJsUrl,

  endpoints: {
    auth: {
      login: '/auth/login',
      logout: '/auth/logout',
      logoutAll: '/auth/logout-all',
      sessions: '/auth/sesiones',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
    },

    users: {
      register: '/usuarios/registro',
      me: '/usuarios/me',
      search: '/usuarios/buscar',
      byId: (id: string) => `/usuarios/${id}`,
      blocks: '/usuarios/me/bloqueos',
      blockById: (id: string) => `/usuarios/me/bloqueos/${id}`,
    },

    chats: {
      list: '/chats',
      byId: (id: string) => `/chats/${id}`,
      individual: '/chats/individual',
      group: '/chats/grupo',
      read: (id: string) => `/chats/${id}/leido`,
      config: (id: string) => `/chats/${id}/configuracion`,
      members: (id: string) => `/chats/${id}/miembros`,
    },

    messages: {
      list: (chatId: string) => `/chats/${chatId}/mensajes`,
      send: (chatId: string) => `/chats/${chatId}/mensajes`,
      byId: (chatId: string, messageId: string) => `/chats/${chatId}/mensajes/${messageId}`,
      reaction: (chatId: string, messageId: string) =>
        `/chats/${chatId}/mensajes/${messageId}/reaccion`,
      forward: (chatId: string, messageId: string) =>
        `/chats/${chatId}/mensajes/${messageId}/forward`,
    },

    files: {
      get: '/archivos',
    },
  },
} as const;
