export interface IMongoEsIndexerOptions {
  configDir: string;
  esHosts: string | Array<string>;
  mongoUri: string;
  indexPrefix?: string;
  defaultConfigPath?: string;
}
