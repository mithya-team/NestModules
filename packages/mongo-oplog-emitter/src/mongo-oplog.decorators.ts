import { SetMetadata } from '@nestjs/common';
import { MONGO_OPLOG_HANDLER } from './constants';

export type TOperationTypes = 'insert' | 'update' | 'delete';

export const MongoOplogHandler = (operationTyoe: TOperationTypes) =>
  SetMetadata(MONGO_OPLOG_HANDLER, operationTyoe);
