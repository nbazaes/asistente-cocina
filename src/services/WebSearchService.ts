export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchService {
  search(query: string): Promise<WebSearchResult[]>;
}

let serperApiKey: string = '';

export function setSerperApiKey(key: string): void {
  serperApiKey = key;
}

class SerperWebSearchService implements WebSearchService {
  async search(query: string): Promise<WebSearchResult[]> {
    if (!serperApiKey) {
      throw new Error('Serper API key no configurada. Ve a Ajustes para configurarla.');
    }

    const siteFilters = [
      'site:recetas.elperiodico.com',
      'site:directoalpaladar.com',
      'site:divinacocina.es',
    ];
    const searchQuery = `${query} ${siteFilters.join(' OR ')}`;

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: searchQuery,
        num: 5,
        gl: 'es',
        hl: 'es',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en la búsqueda: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as {
      organic?: { title: string; link: string; snippet: string }[];
    };

    return (data.organic ?? []).map((r) => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet,
    }));
  }
}

export const webSearchService: WebSearchService = new SerperWebSearchService();
