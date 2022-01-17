import {
  Global,
  Inject,
  Injectable,
  OnModuleInit,
  Scope,
  Type,
} from '@nestjs/common';
import { MongoOplogHandler } from '@mithyateam/mongo-oplog-emitter';
import MongoEsIndexer from 'mongoesindexer';
import { MONGO_ES_INDEXER } from './constants';

@Injectable()
class ComponentElasticsearchService {
  MongoEsIndexer: MongoEsIndexer;
  private indexName: string;

  setIndexName(indexName: string): void {
    this.indexName = indexName;
  }

  constructor(
    @Inject(MONGO_ES_INDEXER) private readonly mongoEsIndexer: MongoEsIndexer,
  ) {
    this.MongoEsIndexer = mongoEsIndexer;
  }

  @MongoOplogHandler('insert')
  async indexOne({ collection: indexName, oplogData }) {
    try {
      await this.MongoEsIndexer.indexOne(
        `${this.MongoEsIndexer.indexPrefix}${indexName}`,
        oplogData?.documentKey?._id,
      );
    } catch (error) {
      console.error(error.message);
    }
  }

  @MongoOplogHandler('update')
  async updateOne({ collection: indexName, oplogData }) {
    try {
      await this.MongoEsIndexer.updateOne(
        `${this.MongoEsIndexer.indexPrefix}${indexName}`,
        oplogData?.documentKey?._id,
      );
    } catch (error) {
      console.error(error.message);
    }
  }

  @MongoOplogHandler('delete')
  deleteByIds({ collection: indexName, oplogData }): Promise<any> {
    return this.MongoEsIndexer.deleteByIds(`${this.MongoEsIndexer.indexPrefix}${indexName}`, [
      oplogData?.documentKey?._id,
    ]);
  }
}

export default ComponentElasticsearchService;
