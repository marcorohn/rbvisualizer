import { Environment } from './environment.types';

export const environment: Environment = {
  production: false,
  serverUrl: 'http://localhost:8082',
  basePath: '/',
  webSocketEndpoint: 'ws',
  restEndpoint: 'api',
};
