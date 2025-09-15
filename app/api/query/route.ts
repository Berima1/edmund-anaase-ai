// app/api/query/route.ts - ENHANCED BACKEND WITH MULTIPLE FREE APIs
import { NextRequest, NextResponse } from 'next/server';

// [Previous interfaces remain the same...]
interface Document {
  id: string;
  score: number;
  preview: string;
  content: string;
  meta: {
    topic: string;
    category: string;
    importance: string;
    keywords: string[];
    domain: string;
  };
}

interface GraphTriple {
  subject: string;
  predicate: string;
  object: string;
  weight: number;
  confidence: number;
  source: string;
}

interface TraceItem {
  type: string;
  timestamp: string;
  info: Record<string, any>;
  score?: number;
}

interface DeepAnalysis {
  conceptualDepth: number;
  crossDomainConnections: number;
  inferenceChains: string[];
  confidenceScore: number;
}

interface QueryResponse {
  answer: string;
  docs: Document[];
  path: GraphTriple[];
  rulesFired: string[];
  trace: TraceItem[];
  deepAnalysis: DeepAnalysis;
  alternativeQuestions: string[];
  relatedConcepts: string[];
  metadata: {
    timestamp: string;
    version: string;
    dataSources: string[];
    realTime: boolean;
  };
}

interface ConsolidatedData {
  sources: string[];
  documents: Document[];
  relationships: GraphTriple[];
  domains: Set<string>;
  complexity: number;
  confidence: number;
  totalResults: number;
  inferenceChains: string[];
}

// Enhanced Real Backend with Multiple Free APIs
class EnhancedRealBackend {
  // Existing APIs
  private wikipediaAPI = 'https://en.wikipedia.org/api/rest_v1';
  private newsAPI = process.env.NEWS_API_KEY ? 'https://newsapi.org/v2' : null;
  
  // New Free APIs
  private openLibraryAPI = 'https://openlibrary.org';
  private countriesAPI = 'https://restcountries.com/v3.1';
  private quotesAPI = 'https://api.quotable.io';
  private numbersAPI = 'http://numbersapi.com';
  private nasaAPI = 'https://api.nasa.gov';
  private weatherAPI = 'https://api.openweathermap.org/data/2.5';
  private githubAPI = 'https://api.github.com';
  private coingeckoAPI = 'https://api.coingecko.com/api/v3';
  private stackOverflowAPI = 'https://api.stackexchange.com/2.3';
  private redditAPI = 'https://www.reddit.com/r';

  async query(question: string, options: Record<string, any> = {}): Promise<QueryResponse> {
    const startTime = Date.now();
    const trace: TraceItem[] = [];

    // Step 1: Enhanced query analysis
    trace.push({
      type: "enhanced-query-analysis",
      timestamp: new Date().toISOString(),
      info: { question, method: "multi_domain_analysis" }
    });

    const queryAnalysis = this.analyzeEnhancedQuery(question);
    
    // Step 2: Dynamic API selection based on query type
    const selectedAPIs = this.selectRelevantAPIs(queryAnalysis);
    
    trace.push({
      type: "dynamic-api-selection",
      timestamp: new Date().toISOString(),
      info: { 
        selectedAPIs,
        queryType: queryAnalysis.category,
        confidence: queryAnalysis.confidence
      }
    });

    // Step 3: Parallel search across selected APIs
    const searchPromises = this.createSearchPromises(queryAnalysis, selectedAPIs);
    const results = await Promise.allSettled(searchPromises);
    const realData = this.consolidateEnhancedResults(results);

    // Step 4: Generate comprehensive answer
    const answer = this.generateEnhancedAnswer(question, queryAnalysis, realData);
    const relatedConcepts = this.extractEnhancedConcepts(realData);
    const alternativeQuestions = this.generateSmartFollowUps(question, realData);

    const processingTime = Date.now() - startTime;
    trace.push({
      type: "enhanced-synthesis",
      timestamp: new Date().toISOString(),
      info: {
        processingTime: `${processingTime}ms`,
        apisUsed: selectedAPIs,
        dataPoints: realData.totalResults,
        confidenceScore: realData.confidence,
        domains: Array.from(realData.domains)
      }
    });

    return {
      answer,
      docs: realData.documents,
      path: realData.relationships,
      rulesFired: queryAnalysis.matchedPatterns,
      trace,
      deepAnalysis: {
        conceptualDepth: Math.min(realData.complexity, 10),
        crossDomainConnections: realData.domains.size,
        inferenceChains: realData.inferenceChains,
        confidenceScore: Math.round(realData.confidence * 100)
      },
      alternativeQuestions,
      relatedConcepts,
      metadata: {
        timestamp: new Date().toISOString(),
        version: "enhanced-backend-v2.0",
        dataSources: realData.sources,
        realTime: true
      }
    };
  }

  private analyzeEnhancedQuery(question: string) {
    const questionLower = question.toLowerCase();
    
    // Enhanced categorization
    const categories = {
      books: /book|author|literature|novel|story|reading/i,
      geography: /country|capital|population|location|where is/i,
      quotes: /quote|saying|quotation|famous words/i,
      numbers: /number|fact about \d+|mathematical/i,
      space: /space|planet|nasa|astronomy|mars|moon/i,
      weather: /weather|temperature|climate|forecast/i,
      tech: /programming|code|github|software|developer/i,
      crypto: /bitcoin|cryptocurrency|crypto|ethereum|price/i,
      finance: /stock|market|price|investment|trading/i,
      current: /latest|recent|current|today|news/i,
      definition: /what is|define|explain|meaning/i,
      comparison: /compare|difference|versus|vs/i,
      howto: /how to|how do|how does/i
    };

    const detectedCategories: string[] = [];
    let confidence = 0.5;

    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(questionLower)) {
        detectedCategories.push(category);
        confidence += 0.1;
      }
    }

    // Extract entities and keywords
    const words = question.split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['what', 'how', 'when', 'where', 'why', 'the', 'and', 'or', 'but'].includes(word.toLowerCase()));

    return {
      mainTopic: words.slice(0, 3).join(' '),
      entities: words,
      category: detectedCategories[0] || 'general',
      categories: detectedCategories,
      confidence: Math.min(confidence, 0.95),
      matchedPatterns: detectedCategories,
      needsRealTime: /latest|recent|current|today|price/.test(questionLower)
    };
  }

  private selectRelevantAPIs(analysis: any): string[] {
    const apiMap: Record<string, string[]> = {
      books: ['wikipedia', 'openlibrary'],
      geography: ['wikipedia', 'countries', 'weather'],
      quotes: ['quotable', 'wikipedia'],
      numbers: ['numbers', 'wikipedia'],
      space: ['nasa', 'wikipedia'],
      weather: ['weather', 'wikipedia'],
      tech: ['github', 'stackoverflow', 'wikipedia'],
      crypto: ['coingecko', 'news', 'reddit'],
      finance: ['news', 'reddit'],
      current: ['news', 'reddit', 'wikipedia'],
      general: ['wikipedia', 'news']
    };

    const selectedAPIs = new Set<string>();
    
    // Add APIs based on detected categories
    for (const category of analysis.categories) {
      const apis = apiMap[category] || [];
      apis.forEach(api => selectedAPIs.add(api));
    }

    // Always include Wikipedia as baseline
    selectedAPIs.add('wikipedia');

    // Add news if real-time is needed
    if (analysis.needsRealTime) {
      selectedAPIs.add('news');
      selectedAPIs.add('reddit');
    }

    return Array.from(selectedAPIs).slice(0, 6); // Limit to 6 APIs for performance
  }

  private createSearchPromises(analysis: any, selectedAPIs: string[]) {
    const promises: Promise<any>[] = [];

    for (const api of selectedAPIs) {
      switch (api) {
        case 'wikipedia':
          promises.push(this.searchWikipedia(analysis.mainTopic));
          break;
        case 'news':
          if (this.newsAPI) promises.push(this.searchNews(analysis.mainTopic));
          break;
        case 'openlibrary':
          promises.push(this.searchOpenLibrary(analysis.mainTopic));
          break;
        case 'countries':
          promises.push(this.searchCountries(analysis.mainTopic));
          break;
        case 'quotable':
          promises.push(this.searchQuotes(analysis.mainTopic));
          break;
        case 'numbers':
          promises.push(this.searchNumbers(analysis.mainTopic));
          break;
        case 'nasa':
          promises.push(this.searchNASA(analysis.mainTopic));
          break;
        case 'github':
          promises.push(this.searchGitHub(analysis.mainTopic));
          break;
        case 'coingecko':
          promises.push(this.searchCrypto(analysis.mainTopic));
          break;
        case 'stackoverflow':
          promises.push(this.searchStackOverflow(analysis.mainTopic));
          break;
        case 'reddit':
          promises.push(this.searchReddit(analysis.mainTopic));
          break;
      }
    }

    return promises;
  }

  // New API search methods
  private async searchOpenLibrary(topic: string) {
    try {
      const response = await fetch(
        `${this.openLibraryAPI}/search.json?q=${encodeURIComponent(topic)}&limit=3`
      );
      
      if (!response.ok) throw new Error('OpenLibrary search failed');
      
      const data = await response.json();
      
      return {
        source: 'openlibrary',
        books: data.docs?.slice(0, 3).map((book: any) => ({
          title: book.title,
          author: book.author_name?.[0] || 'Unknown Author',
          publishYear: book.first_publish_year,
          subjects: book.subject?.slice(0, 3) || []
        })) || [],
        credibility: 0.8,
        type: 'literature'
      };
    } catch (error) {
      console.error('OpenLibrary search error:', error);
      return null;
    }
  }

  private async searchCountries(topic: string) {
    try {
      const response = await fetch(
        `${this.countriesAPI}/name/${encodeURIComponent(topic)}`
      );
      
      if (!response.ok) throw new Error('Countries search failed');
      
      const data = await response.json();
      
      return {
        source: 'countries',
        countries: data.slice(0, 2).map((country: any) => ({
          name: country.name.common,
          capital: country.capital?.[0],
          population: country.population,
          region: country.region,
          languages: Object.values(country.languages || {}).join(', ')
        })),
        credibility: 0.9,
        type: 'geography'
      };
    } catch (error) {
      console.error('Countries search error:', error);
      return null;
    }
  }

  private async searchQuotes(topic: string) {
    try {
      const response = await fetch(
        `${this.quotesAPI}/quotes?tags=${encodeURIComponent(topic)}&limit=3`
      );
      
      if (!response.ok) throw new Error('Quotes search failed');
      
      const data = await response.json();
      
      return {
        source: 'quotable',
        quotes: data.results?.map((quote: any) => ({
          content: quote.content,
          author: quote.author,
          tags: quote.tags
        })) || [],
        credibility: 0.7,
        type: 'wisdom'
      };
    } catch (error) {
      console.error('Quotes search error:', error);
      return null;
    }
  }

  private async searchNumbers(topic: string) {
    // Extract number from topic if present
    const numberMatch = topic.match(/\d+/);
    if (!numberMatch) return null;

    try {
      const response = await fetch(`${this.numbersAPI}/${numberMatch[0]}`);
      
      if (!response.ok) throw new Error('Numbers API failed');
      
      const fact = await response.text();
      
      return {
        source: 'numbers',
        fact,
        number: numberMatch[0],
        credibility: 0.6,
        type: 'mathematics'
      };
    } catch (error) {
      console.error('Numbers search error:', error);
      return null;
    }
  }

  private async searchNASA(topic: string) {
    try {
      // Use NASA's image and video library
      const response = await fetch(
        `https://images-api.nasa.gov/search?q=${encodeURIComponent(topic)}&media_type=image&page_size=3`
      );
      
      if (!response.ok) throw new Error('NASA search failed');
      
      const data = await response.json();
      
      return {
        source: 'nasa',
        items: data.collection?.items?.slice(0, 2).map((item: any) => ({
          title: item.data?.[0]?.title,
          description: item.data?.[0]?.description,
          dateCreated: item.data?.[0]?.date_created,
          center: item.data?.[0]?.center
        })) || [],
        credibility: 0.95,
        type: 'space'
      };
    } catch (error) {
      console.error('NASA search error:', error);
      return null;
    }
  }

  private async searchGitHub(topic: string) {
    try {
      const response = await fetch(
        `${this.githubAPI}/search/repositories?q=${encodeURIComponent(topic)}&sort=stars&per_page=3`
      );
      
      if (!response.ok) throw new Error('GitHub search failed');
      
      const data = await response.json();
      
      return {
        source: 'github',
        repositories: data.items?.slice(0, 3).map((repo: any) => ({
          name: repo.name,
          description: repo.description,
          stars: repo.stargazers_count,
          language: repo.language,
          owner: repo.owner.login
        })) || [],
        credibility: 0.8,
        type: 'technology'
      };
    } catch (error) {
      console.error('GitHub search error:', error);
      return null;
    }
  }

  private async searchCrypto(topic: string) {
    try {
      const response = await fetch(
        `${this.coingeckoAPI}/search?query=${encodeURIComponent(topic)}`
      );
      
      if (!response.ok) throw new Error('CoinGecko search failed');
      
      const data = await response.json();
      
      return {
        source: 'coingecko',
        coins: data.coins?.slice(0, 3).map((coin: any) => ({
          name: coin.name,
          symbol: coin.symbol,
          marketCapRank: coin.market_cap_rank
        })) || [],
        credibility: 0.8,
        type: 'cryptocurrency'
      };
    } catch (error) {
      console.error('CoinGecko search error:', error);
      return null;
    }
  }

  private async searchStackOverflow(topic: string) {
    try {
      const response = await fetch(
        `${this.stackOverflowAPI}/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(topic)}&site=stackoverflow`
      );
      
      if (!response.ok) throw new Error('StackOverflow search failed');
      
      const data = await response.json();
      
      return {
        source: 'stackoverflow',
        questions: data.items?.slice(0, 3).map((item: any) => ({
          title: item.title,
          score: item.score,
          answerCount: item.answer_count,
          tags: item.tags
        })) || [],
        credibility: 0.8,
        type: 'programming'
      };
    } catch (error) {
      console.error('StackOverflow search error:', error);
      return null;
    }
  }

  private async searchReddit(topic: string) {
    try {
      const response = await fetch(
        `${this.redditAPI}/all/search.json?q=${encodeURIComponent(topic)}&limit=3&sort=relevance`
      );
      
      if (!response.ok) throw new Error('Reddit search failed');
      
      const data = await response.json();
      
      return {
        source: 'reddit',
        posts: data.data?.children?.slice(0, 2).map((post: any) => ({
          title: post.data.title,
          subreddit: post.data.subreddit,
          score: post.data.score,
          numComments: post.data.num_comments
        })) || [],
        credibility: 0.5,
        type: 'social'
      };
    } catch (error) {
      console.error('Reddit search error:', error);
      return null;
    }
  }

  // Enhanced result consolidation
  private consolidateEnhancedResults(results: PromiseSettledResult<any>[]): ConsolidatedData {
    const consolidated: ConsolidatedData = {
      sources: [] as string[],
      documents: [] as Document[],
      relationships: [] as GraphTriple[],
      domains: new Set<string>(),
      complexity: 0,
      confidence: 0,
      totalResults: 0,
      inferenceChains: [] as string[]
    };

    let validResults = 0;

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const data = result.value;
        consolidated.sources.push(data.source);
        validResults++;

        // Process different data types
        this.processDataBySource(data, consolidated);
      }
    }

    consolidated.confidence = validResults > 0 ? Math.min(0.95, validResults * 0.15 + 0.25) : 0.1;
    consolidated.totalResults = consolidated.documents.length;
    consolidated.inferenceChains = consolidated.documents.slice(0, 4).map(doc => 
      `${doc.meta.domain}: ${doc.meta.topic} → ${doc.meta.category}`
    );

    return consolidated;
  }

  private processDataBySource(data: any, consolidated: ConsolidatedData) {
    switch (data.source) {
      case 'openlibrary':
        this.processBookData(data, consolidated);
        break;
      case 'countries':
        this.processCountryData(data, consolidated);
        break;
      case 'quotable':
        this.processQuoteData(data, consolidated);
        break;
      case 'numbers':
        this.processNumberData(data, consolidated);
        break;
      case 'nasa':
        this.processNASAData(data, consolidated);
        break;
      case 'github':
        this.processGitHubData(data, consolidated);
        break;
      case 'coingecko':
        this.processCryptoData(data, consolidated);
        break;
      case 'stackoverflow':
        this.processStackOverflowData(data, consolidated);
        break;
      case 'reddit':
        this.processRedditData(data, consolidated);
        break;
    }
  }

  // Data processing methods for each source
  private processBookData(data: any, consolidated: ConsolidatedData) {
    for (const book of data.books || []) {
      consolidated.documents.push({
        id: 'book-' + Date.now() + Math.random(),
        score: 0.8,
        preview: `"${book.title}" by ${book.author} (${book.publishYear})`,
        content: `${book.title} by ${book.author}, published in ${book.publishYear}. Subjects: ${book.subjects.join(', ')}`,
        meta: {
          topic: 'literature',
          category: 'books',
          importance: 'medium',
          keywords: [book.title, book.author, 'literature'],
          domain: 'literature'
        }
      });
    }
    consolidated.domains.add('literature');
    consolidated.complexity += 1;
  }

  private processCountryData(data: any, consolidated: ConsolidatedData) {
    for (const country of data.countries || []) {
      consolidated.documents.push({
        id: 'country-' + Date.now() + Math.random(),
        score: 0.9,
        preview: `${country.name}: Capital ${country.capital}, Population ${country.population.toLocaleString()}`,
        content: `${country.name} is located in ${country.region} with capital city ${country.capital}. Population: ${country.population.toLocaleString()}. Languages: ${country.languages}`,
        meta: {
          topic: 'geography',
          category: 'countries',
          importance: 'high',
          keywords: [country.name, country.capital, country.region],
          domain: 'geography'
        }
      });
    }
    consolidated.domains.add('geography');
    consolidated.complexity += 2;
  }

  private processQuoteData(data: any, consolidated: ConsolidatedData) {
    for (const quote of data.quotes || []) {
      consolidated.documents.push({
        id: 'quote-' + Date.now() + Math.random(),
        score: 0.7,
        preview: `"${quote.content}" - ${quote.author}`,
        content: `Quote by ${quote.author}: "${quote.content}" Tags: ${quote.tags.join(', ')}`,
        meta: {
          topic: 'wisdom',
          category: 'quotes',
          importance: 'medium',
          keywords: [quote.author, ...quote.tags],
          domain: 'philosophy'
        }
      });
    }
    consolidated.domains.add('philosophy');
    consolidated.complexity += 1;
  }

  private processNumberData(data: any, consolidated: ConsolidatedData) {
    if (data.fact) {
      consolidated.documents.push({
        id: 'number-' + Date.now(),
        score: 0.6,
        preview: `Mathematical fact about ${data.number}`,
        content: data.fact,
        meta: {
          topic: 'mathematics',
          category: 'facts',
          importance: 'low',
          keywords: [data.number, 'mathematics', 'fact'],
          domain: 'mathematics'
        }
      });
      consolidated.domains.add('mathematics');
      consolidated.complexity += 1;
    }
  }

  private processNASAData(data: any, consolidated: ConsolidatedData) {
    for (const item of data.items || []) {
      consolidated.documents.push({
        id: 'nasa-' + Date.now() + Math.random(),
        score: 0.95,
        preview: `NASA: ${item.title}`,
        content: `${item.title}: ${item.description} (${item.center}, ${item.dateCreated})`,
        meta: {
          topic: 'space',
          category: 'astronomy',
          importance: 'high',
          keywords: ['nasa', 'space', 'astronomy'],
          domain: 'science'
        }
      });
    }
    consolidated.domains.add('science');
    consolidated.complexity += 3;
  }

  private processGitHubData(data: any, consolidated: ConsolidatedData) {
    for (const repo of data.repositories || []) {
      consolidated.documents.push({
        id: 'github-' + Date.now() + Math.random(),
        score: 0.8,
        preview: `${repo.name} by ${repo.owner} (${repo.stars} stars)`,
        content: `${repo.name}: ${repo.description} Language: ${repo.language}, Stars: ${repo.stars}`,
        meta: {
          topic: 'programming',
          category: 'opensource',
          importance: 'medium',
          keywords: [repo.name, repo.language, 'github'],
          domain: 'technology'
        }
      });
    }
    consolidated.domains.add('technology');
    consolidated.complexity += 2;
  }

  private processCryptoData(data: any, consolidated: ConsolidatedData) {
    for (const coin of data.coins || []) {
      consolidated.documents.push({
        id: 'crypto-' + Date.now() + Math.random(),
        score: 0.8,
        preview: `${coin.name} (${coin.symbol}) - Rank #${coin.marketCapRank}`,
        content: `${coin.name} (${coin.symbol}) is ranked #${coin.marketCapRank} by market capitalization`,
        meta: {
          topic: 'cryptocurrency',
          category: 'finance',
          importance: 'medium',
          keywords: [coin.name, coin.symbol, 'crypto'],
          domain: 'finance'
        }
      });
    }
    consolidated.domains.add('finance');
    consolidated.complexity += 2;
  }

  private processStackOverflowData(data: any, consolidated: ConsolidatedData) {
    for (const question of data.questions || []) {
      consolidated.documents.push({
        id: 'stackoverflow-' + Date.now() + Math.random(),
        score: 0.8,
        preview: `Stack Overflow: ${question.title.substring(0, 100)}...`,
        content: `Programming question: ${question.title} (Score: ${question.score}, Answers: ${question.answerCount}) Tags: ${question.tags.join(', ')}`,
        meta: {
          topic: 'programming',
          category: 'qna',
          importance: 'medium',
          keywords: [...question.tags, 'programming'],
          domain: 'technology'
        }
      });
    }
    consolidated.domains.add('technology');
    consolidated.complexity += 2;
  }

  private processRedditData(data: any, consolidated: ConsolidatedData) {
    for (const post of data.posts || []) {
      consolidated.documents.push({
        id: 'reddit-' + Date.now() + Math.random(),
        score: 0.5,
        preview: `r/${post.subreddit}: ${post.title.substring(0, 100)}...`,
        content: `Reddit discussion from r/${post.subreddit}: ${post.title} (${post.score} upvotes, ${post.numComments} comments)`,
        meta: {
          topic: 'social',
          category: 'discussion',
          importance: 'low',
          keywords: [post.subreddit, 'reddit', 'social'],
          domain: 'social'
        }
      });
    }
    consolidated.domains.add('social');
    consolidated.complexity += 1;
  }

  // Enhanced answer generation
  private generateEnhancedAnswer(question: string, analysis: any, realData: ConsolidatedData): string {
    if (realData.documents.length === 0) {
      return "I searched across multiple data sources but couldn't find specific information about this topic. This might be a very specialized query or the topic might not be well-covered in the available databases.";
    }

    let answer = "";
    const sortedDocs = realData.documents.sort((a, b) => b.score - a.score);
    const domains = Array.from(realData.domains);

    // Multi-domain introduction
    if (domains.length > 1) {
      answer += `I found relevant information across ${domains.length} domains (${domains.join(', ')}): `;
    }

    // Primary source information
    const primaryDoc = sortedDocs[0];
    answer += primaryDoc.content;

    // Add supporting information from different domains
    const supportingDocs = sortedDocs.slice(1, 3)
      .filter(doc => doc.meta.domain !== primaryDoc.meta.domain);
    
    if (supportingDocs.length > 0) {
      answer += "\n\nAdditional perspectives: ";
      answer += supportingDocs.map(doc => doc.content).join(' ');
    }

    // Add confidence and source information
    if (realData.confidence > 0.8) {
      answer += `\n\nThis information is compiled from ${realData.sources.length} reliable sources including ${realData.sources.slice(0, 3).join(', ')}.`;
    }

    return answer;
}
