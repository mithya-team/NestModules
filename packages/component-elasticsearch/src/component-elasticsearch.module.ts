import {
  DynamicModule,
  Global,
  Inject,
  Module,
  OnModuleInit,
  Provider,
} from '@nestjs/common';
import { COMPONENT_ELASTICSEARCH_OPTIONS, MONGO_ES_INDEXER } from './constants';
import {
  ComponentElasticsearchAsyncOptions,
  ComponentElasticsearchModuleOptions,
  ElasticsearchOptionsFactory,
} from './interfaces/component-elasticsearch-options.interface';
import ComponentElasticsearchService from './component-elasticsearch.service';
import MongoEsIndexer from 'mongoesindexer';
import { createComponentElasticsearchrProviders } from './component-elasticsearch.provider';
import { MongoOplogModule } from '@mithyateam/mongo-oplog-emitter';

@Global()
@Module({
  providers: [ComponentElasticsearchService],
})
export default class ComponentElasticsearchModule {
  static register(options: ComponentElasticsearchModuleOptions): DynamicModule {
    return {
      module: ComponentElasticsearchModule,
      providers: [
        { provide: COMPONENT_ELASTICSEARCH_OPTIONS, useValue: options },
        {
          provide: MONGO_ES_INDEXER,
          useFactory: () => this.mongoEsIndexerInstance,
        },
      ],
    };
  }

  static registerAsync(
    options: ComponentElasticsearchAsyncOptions,
  ): DynamicModule {
    const esProviders = createComponentElasticsearchrProviders();

    return {
      module: ComponentElasticsearchModule,
      imports: [
        MongoOplogModule.registerAsync({
          useFactory: () => {
            return {
              host: 'mongodb://localhost:27017/?replicaSet=rs0',
              database: 'NestEs',
            };
          },
        }),
        ...(options.imports || []),
      ],
      providers: [
        ...this.createAsyncProviders(options),
        {
          provide: MONGO_ES_INDEXER,
          useFactory: (options: ComponentElasticsearchModuleOptions) => {
            return this.initializeMongoEsIndexer(options);
          },
          inject: [COMPONENT_ELASTICSEARCH_OPTIONS],
        },
        ...esProviders,
      ],
      exports: [...esProviders],
    };
  }

  private static createAsyncProviders(
    options: ComponentElasticsearchAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: ComponentElasticsearchAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: COMPONENT_ELASTICSEARCH_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    return {
      provide: COMPONENT_ELASTICSEARCH_OPTIONS,
      useFactory: async (optionsFactory: ElasticsearchOptionsFactory) => {
        return await optionsFactory.createElasticsearchOptions();
      },
      inject: [options.useExisting || options.useClass],
    };
  }

  constructor(
    @Inject(COMPONENT_ELASTICSEARCH_OPTIONS)
    private readonly options: ComponentElasticsearchModuleOptions,
  ) {}

  static mongoEsIndexerInstance: any;

  static async initializeMongoEsIndexer(
    options: ComponentElasticsearchModuleOptions,
  ) {
    const mongoEsIndexerOptions: ComponentElasticsearchModuleOptions = {
      esHosts: 'http://localhost:9200',
      ...options,
    };

    const mongoEsIndexerInstance = new MongoEsIndexer(
      mongoEsIndexerOptions.configDir,
      mongoEsIndexerOptions.esHosts || 'http://localhost:9200',
      mongoEsIndexerOptions.mongoUri,
      mongoEsIndexerOptions.indexPrefix,
      mongoEsIndexerOptions.defaultConfigPath,
    );
    await mongoEsIndexerInstance.setup();
    await mongoEsIndexerInstance.init();
    return mongoEsIndexerInstance;
  }
}
