export const environment = {
  production: false,
  apiBaseUrl: '/api',
  wsUrl: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`,
  sockJsUrl: `${location.protocol}//${location.host}/ws-sockjs`,
  apiCryptoAlgorithm: 'DES_CBC',
  apiCryptoSecret: '',
  wsCryptoAlgorithm: 'CHACHA20',
  wsCryptoSecret: '',
};
