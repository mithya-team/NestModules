export const MONGO_OPLOG_OPTIONS = 'MongoOplogOptions';
export const MONGO_OPLOG_HANDLER = 'MongoOplogHandler';

export interface IMongoOplogOptions {
  host: string;
  database: string;
}

export interface IMongoOplogModuleOptions {
  inject?: any[];
  imports?: any[];
  useFactory: (
    ...args: any[]
  ) => Promise<IMongoOplogOptions> | IMongoOplogOptions;
}
