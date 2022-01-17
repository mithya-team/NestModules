import { Provider } from '@nestjs/common';
import ComponentElasticsearchService from './component-elasticsearch.service';
import { prefixesForComponentElasticsearch } from './decorators/component-elasticsearch.decorator';

function componentEsFactory(
  componentElasticsearchService: ComponentElasticsearchService,
  indexName: string,
) {
  if (indexName) {
    componentElasticsearchService.setIndexName(indexName);
  }
  return componentElasticsearchService;
}

function createComponentElasticsearchProvider(
  indexName: string,
): Provider<ComponentElasticsearchService> {
  return {
    provide: `ComponentElasticsearch${indexName}`,
    useFactory: (componentElasticsearchService) =>
      componentEsFactory(componentElasticsearchService, indexName),
    inject: [ComponentElasticsearchService],
  };
}

export function createComponentElasticsearchrProviders(): Array<
  Provider<ComponentElasticsearchService>
> {
  return prefixesForComponentElasticsearch.map((indexName) =>
    createComponentElasticsearchProvider(indexName),
  );
}
