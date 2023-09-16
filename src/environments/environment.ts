// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment } from './environment.types';

export const environment: Environment = {
  production: false,
  serverUrl: 'http://localhost:8082',
  basePath: '/',
  webSocketEndpoint: 'api/websocket',
  restEndpoint: 'api',
};
