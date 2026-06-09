// Los marcadores DOCKER_* son reemplazados por `sed` en el Dockerfile
// antes de ejecutar `npm run build`. No edites este archivo manualmente.
export const environment = {
  production: true,
  apiBaseUrl: '/api',
  wsUrl: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`,
  sockJsUrl: `${location.protocol}//${location.host}/ws-sockjs`,
  apiCryptoAlgorithm: 'DOCKER_API_ALGO',
  apiCryptoSecret: 'DOCKER_API_SECRET',
  wsCryptoAlgorithm: 'DOCKER_WS_ALGO',
  wsCryptoSecret: 'DOCKER_WS_SECRET',
};
