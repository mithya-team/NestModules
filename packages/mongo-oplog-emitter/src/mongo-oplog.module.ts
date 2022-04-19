import {
  flatten,
  Global,
  Inject,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { MongoOplogService } from './mongo-oplog.service';
import { MongoClient } from 'mongodb';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import {
  IMongoOplogModuleOptions,
  IMongoOplogOptions,
  MONGO_OPLOG_HANDLER,
  MONGO_OPLOG_OPTIONS,
} from './constants';
import { DiscoveryModule, DiscoveryService } from '@golevelup/nestjs-discovery';
import { groupBy } from 'lodash';

// @TODO: Make use of golevelup nest-module
@Global()
@Module({
  providers: [MongoOplogService],
})
export class MongoOplogModule implements OnModuleInit, OnModuleDestroy {
  static registerAsync(options: IMongoOplogModuleOptions) {
    return {
      imports: [DiscoveryModule, ...options.imports],
      module: MongoOplogModule,
      useFactory: options.useFactory,
      inject: options.inject || [],
      providers: [
        {
          provide: MONGO_OPLOG_OPTIONS,
          useFactory: options.useFactory,
        },
      ],
    };
  }

  constructor(
    @Inject(MONGO_OPLOG_OPTIONS)
    private readonly mongoOplogOptions: IMongoOplogOptions,
    private readonly discover: DiscoveryService,
    private readonly externalContextCreator: ExternalContextCreator,
  ) {}

  dbStreams: Array<any> = [];

  async onModuleInit() {
    const { host } = this.mongoOplogOptions;

    const oplogHandlersMeta =
      await this.discover.providerMethodsWithMetaAtKey<string>(
        MONGO_OPLOG_HANDLER,
      );

    const grouped = groupBy(
      oplogHandlersMeta,
      (x) => x.discoveredMethod.parentClass.name,
    );

    const oplogHandlers = flatten(
      Object.keys(grouped).map((x) => {
        return grouped[x].map(({ discoveredMethod, meta: eventType }) => ({
          key: eventType,
          handler: this.externalContextCreator.create(
            discoveredMethod.parentClass.instance,
            discoveredMethod.handler,
            discoveredMethod.methodName,
          ),
        }));
      }),
    );

    if (!oplogHandlers.length) {
      return;
    }

    const handleOplogEvents = async (data: any) => {
      const { ns, operationType } = data;

      const handlers = oplogHandlers.filter((x) => x.key === operationType);

      await Promise.allSettled(
        handlers.map(({ handler }) =>
          handler({
            collection: ns.coll,
            oplogData: data,
          }),
        ),
      );
    };

    const client = new MongoClient(host, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const clientConnection = await client.connect();
    const db = clientConnection.db(this.mongoOplogOptions.database);
    const dbStream = db.watch();
    this.dbStreams.push(dbStream);
    dbStream.on('change', handleOplogEvents);
  }

  onModuleDestroy() {
    this.dbStreams.forEach((x) => x.close());
  }
}
