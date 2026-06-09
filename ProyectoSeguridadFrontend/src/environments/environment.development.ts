export const environment = {
  production: false,
  apiBaseUrl: '/api',
  wsUrl: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`,
  sockJsUrl: `${location.protocol}//${location.host}/ws-sockjs`,
  // Capa 2 – DES-CBC: debe coincidir con MESSENGER_API_CRYPTO_* del backend
  apiCryptoAlgorithm: 'DES_CBC',
  apiCryptoSecret: 'Secr3t8!',
  // Capa 3 – ChaCha20: debe coincidir con MESSENGER_WS_CRYPTO_* del backend
  wsCryptoAlgorithm: 'CHACHA20',
  wsCryptoSecret: 'CambiaEsto_ChaCha20Poly_32ByteKey',
};
