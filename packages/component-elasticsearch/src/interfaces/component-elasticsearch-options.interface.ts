import { ModuleMetadata, Type } from '@nestjs/common';
import { IMongoEsIndexerOptions } from './mongoesindexer-options.interface';

export type ComponentElasticsearchModuleOptions = IMongoEsIndexerOptions;

export interface ElasticsearchOptionsFactory {
  createElasticsearchOptions():
    | Promise<ComponentElasticsearchModuleOptions>
    | ComponentElasticsearchModuleOptions;
}

export interface ComponentElasticsearchAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<ElasticsearchOptionsFactory>;
  useClass?: Type<ElasticsearchOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) =>
    | Promise<ComponentElasticsearchModuleOptions>
    | ComponentElasticsearchModuleOptions;
  inject?: any[];
}
