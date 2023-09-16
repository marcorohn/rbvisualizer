// eslint-disable-next-line @typescript-eslint/no-unused-vars

// TODO add more documentation
export interface Environment {
  /**
   * Default: false
   */
  production: boolean;

  /**
   * Specifies the full path to the Server.
   * Only needed, when frontend and server are hosted from seperate locations, like on local development.
   * In production, the host gets taken from the url the site is served from
   */
  serverUrl?: string;
  basePath?: string;
  webSocketEndpoint: string;
  restEndpoint: string;
}
