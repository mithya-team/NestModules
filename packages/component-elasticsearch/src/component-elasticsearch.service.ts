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

  getIndexName(modelName: string): string {
    const [modelConfig] = this.MongoEsIndexer.configs.filter(i=>i.model === modelName);
    if(!modelConfig) {
      // throw new Error('No model config found for model: ' + modelName);
      return;
    }
    return modelConfig.indexName.split(this.MongoEsIndexer.indexPrefix)[1];
  }

  @MongoOplogHandler('insert')
  async indexOne({ collection: modelName, oplogData }) {
    if(!this.getIndexName(modelName)) return;
    try {
      await this.MongoEsIndexer.indexOne(
        `${this.MongoEsIndexer.indexPrefix}${this.getIndexName(modelName)}`,
        oplogData?.documentKey?._id,
      );
    } catch (error) {
      console.error(error.message);
    }
  }

  @MongoOplogHandler('update')
  async updateOne({ collection: modelName, oplogData }) {
    if(!this.getIndexName(modelName)) return;
    try {
      await this.MongoEsIndexer.updateOne(
        `${this.MongoEsIndexer.indexPrefix}${this.getIndexName(modelName)}`,
        oplogData?.documentKey?._id,
      );
    } catch (error) {
      console.error(error.message);
    }
  }

  @MongoOplogHandler('delete')
  deleteByIds({ collection: modelName, oplogData }): Promise<any> {
    if(!this.getIndexName(modelName)) return;
    return this.MongoEsIndexer.deleteByIds(`${this.MongoEsIndexer.indexPrefix}${this.getIndexName(modelName)}`, [
      oplogData?.documentKey?._id,
    ]);
  }
}

export default ComponentElasticsearchService;
