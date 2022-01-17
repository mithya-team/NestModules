import { Inject } from '@nestjs/common';

export const prefixesForComponentElasticsearch: string[] = new Array<string>();
export function ComponentElasticsearch(indexName: string, meta = {}) {
  if (!prefixesForComponentElasticsearch.includes(indexName)) {
    prefixesForComponentElasticsearch.push(indexName);
  }
  return Inject(`ComponentElasticsearch${indexName}`);
}
