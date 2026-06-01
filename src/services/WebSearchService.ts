export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchService {
  search(query: string): Promise<WebSearchResult[]>;
}

class StubWebSearchService implements WebSearchService {
  async search(_query: string): Promise<WebSearchResult[]> {
    return [];
  }
}

export const webSearchService: WebSearchService = new StubWebSearchService();
