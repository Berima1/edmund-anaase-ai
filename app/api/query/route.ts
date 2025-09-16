// app/api/query/route.ts - PRODUCTION-GRADE AI WITH REAL BUSINESS VALUE
import { NextRequest, NextResponse } from 'next/server';

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
    source: string;
    timestamp: string;
  };
}

// Production-grade AI system
class ProductionGradeAI {
  private readonly APIs = {
    // News and Current Events
    newsAPI: process.env.NEWS_API_KEY ? 'https://newsapi.org/v2' : null,
    guardianAPI: 'https://content.guardianapis.com', // Free API
    hackerNewsAPI: 'https://hacker-news.firebaseio.com/v0',
    
    // Knowledge and Reference
    wikipediaAPI: 'https://en.wikipedia.org/api/rest_v1',
    wiktionaryAPI: 'https://en.wiktionary.org/api/rest_v1',
    
    // Weather and Location
    weatherAPI: 'https://api.open-meteo.com/v1',
    geocodingAPI: 'https://geocoding-api.open-meteo.com/v1',
    
    // Finance and Economics
    cryptoAPI: 'https://api.coingecko.com/api/v3',
    freeForexAPI: 'https://api.exchangerate.host',
    
    // Research and Academia
    arxivAPI: 'http://export.arxiv.org/api/query',
    crossrefAPI: 'https://api.crossref.org/works', // Academic papers
    
    // Technology and Development
    githubAPI: 'https://api.github.com',
    stackOverflowAPI: 'https://api.stackexchange.com/2.3',
    
    // Social and Community
    redditAPI: 'https://www.reddit.com',
    
    // Utilities and Facts
    numbersAPI: 'http://numbersapi.com',
    quotableAPI: 'https://api.quotable.io',
    restCountriesAPI: 'https://restcountries.com/v3.1'
  };

  private readonly knowledgeBase = [
    // Business and Economics
    {
      id: 'business-strategy-fundamentals',
      content: 'Business strategy involves defining long-term objectives and determining the best approach to achieve competitive advantage. Key frameworks include Porter\'s Five Forces (competitive rivalry, supplier power, buyer power, threat of substitutes, barriers to entry), SWOT analysis (strengths, weaknesses, opportunities, threats), and value chain analysis. Modern businesses focus on digital transformation, customer experience optimization, data-driven decision making, and sustainable practices. Strategic planning requires market research, competitive analysis, financial modeling, and risk assessment.',
      keywords: ['business', 'strategy', 'competitive advantage', 'porter', 'swot'],
      domain: 'business',
      importance: 'high'
    },
    {
      id: 'financial-markets-analysis',
      content: 'Financial markets include stock markets, bond markets, foreign exchange, commodities, and derivatives. Key indicators include GDP growth, inflation rates, unemployment, interest rates, and corporate earnings. Technical analysis uses price charts and patterns, while fundamental analysis examines economic factors and company financials. Risk management involves diversification, hedging strategies, and portfolio optimization. Market volatility is measured by VIX, beta coefficients, and standard deviation of returns.',
      keywords: ['financial markets', 'stocks', 'bonds', 'forex', 'risk management'],
      domain: 'finance',
      importance: 'high'
    },
    {
      id: 'technology-innovation-trends',
      content: 'Current technology trends include artificial intelligence and machine learning, cloud computing migration, Internet of Things (IoT) expansion, cybersecurity enhancement, and blockchain adoption. AI applications span natural language processing, computer vision, predictive analytics, and autonomous systems. Cloud platforms offer Infrastructure-as-a-Service (IaaS), Platform-as-a-Service (PaaS), and Software-as-a-Service (SaaS). IoT enables smart cities, industrial automation, and connected healthcare. Cybersecurity focuses on zero-trust architecture, threat intelligence, and privacy protection.',
      keywords: ['artificial intelligence', 'cloud computing', 'iot', 'cybersecurity', 'blockchain'],
      domain: 'technology',
      importance: 'high'
    },
    // Add more comprehensive knowledge...
  ];

  async query(question: string, options: Record<string, any> = {}) {
    const startTime = Date.now();
    const trace = [];

    // Enhanced query analysis
    const analysis = await this.performDeepAnalysis(question);
    
    trace.push({
      type: "deep-analysis",
      timestamp: new Date().toISOString(),
      info: {
        query: question,
        intent: analysis.intent,
        entities: analysis.entities,
        domains: analysis.domains,
        complexity: analysis.complexity
      }
    });

    // Multi-source data retrieval
    const dataSources = await this.gatherComprehensiveData(analysis);
    
    trace.push({
      type: "multi-source-retrieval",
      timestamp: new Date().toISOString(),
      info: {
        sourcesAccessed: dataSources.map(d => d.source),
        totalResults: dataSources.reduce((sum, d) => sum + (d.results?.length || 0), 0),
        domains: [...new Set(dataSources.map(d => d.domain))]
      }
    });

    // Intelligent synthesis
    const synthesizedAnswer = await this.synthesizeIntelligentResponse(question, analysis, dataSources);
    
    const processingTime = Date.now() - startTime;
    trace.push({
      type: "intelligent-synthesis",
      timestamp: new Date().toISOString(),
      info: {
        processingTime: `${processingTime}ms`,
        confidenceScore: synthesizedAnswer.confidence,
        sourcesUsed: synthesizedAnswer.sourcesUsed,
        factualClaims: synthesizedAnswer.factualClaims
      }
    });

    return {
      answer: synthesizedAnswer.content,
      docs: synthesizedAnswer.documents,
      path: synthesizedAnswer.relationships,
      rulesFired: analysis.appliedRules,
      trace,
      deepAnalysis: {
        conceptualDepth: analysis.complexity,
        crossDomainConnections: analysis.domains.length,
        inferenceChains: synthesizedAnswer.inferenceChains,
        confidenceScore: Math.round(synthesizedAnswer.confidence * 100)
      },
      alternativeQuestions: this.generateSmartQuestions(analysis, synthesizedAnswer),
      relatedConcepts: this.extractKeyConcepts(synthesizedAnswer),
      metadata: {
        timestamp: new Date().toISOString(),
        version: "production-v3.0",
        dataSources: synthesizedAnswer.sourcesUsed,
        realTime: true,
        businessGrade: true
      }
    };
  }

  private async performDeepAnalysis(question: string) {
    const questionLower = question.toLowerCase();
    
    // Intent classification with high precision
    const intents = {
      factual_query: /what is|define|explain|describe|tell me about/i,
      current_events: /latest|recent|current|news|updates|today|this week/i,
      comparative: /compare|versus|vs|difference between|better than/i,
      analytical: /analyze|analysis|why|how|impact|effect|cause/i,
      procedural: /how to|step by step|process|method|way to/i,
      predictive: /future|predict|forecast|trend|will|expect|outlook/i,
      quantitative: /price|cost|value|number|statistics|data|metrics/i,
      location_based: /where|location|in [A-Z][a-z]+|near|around/i
    };

    // Domain classification with business focus
    const domains = {
      business: /business|company|corporate|enterprise|strategy|management|revenue|profit|market/i,
      finance: /finance|money|investment|stock|bond|currency|trading|economic|bank/i,
      technology: /tech|technology|software|ai|artificial intelligence|programming|digital|innovation/i,
      healthcare: /health|medical|medicine|disease|treatment|hospital|doctor|patient/i,
      education: /education|learning|school|university|student|teaching|academic|research/i,
      government: /government|policy|law|legal|regulation|politics|election|public/i,
      environment: /environment|climate|sustainability|energy|renewable|carbon|green/i,
      entertainment: /entertainment|movie|music|sport|game|celebrity|media/i
    };

    // Entity extraction with business context
    const entities = this.extractBusinessEntities(question);
    
    // Complexity assessment
    const complexity = this.assessQueryComplexity(question, entities);

    const detectedIntents = [];
    const detectedDomains = [];

    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(questionLower)) {
        detectedIntents.push(intent);
      }
    }

    for (const [domain, pattern] of Object.entries(domains)) {
      if (pattern.test(questionLower)) {
        detectedDomains.push(domain);
      }
    }

    return {
      intent: detectedIntents[0] || 'general_inquiry',
      allIntents: detectedIntents,
      domains: detectedDomains.length > 0 ? detectedDomains : ['general'],
      entities,
      complexity,
      appliedRules: this.getApplicableRules(detectedIntents, detectedDomains, entities)
    };
  }

  private extractBusinessEntities(text: string) {
    const entities = {
      companies: [],
      people: [],
      locations: [],
      technologies: [],
      financial_instruments: [],
      metrics: [],
      dates: []
    };

    // Company patterns
    const companyPatterns = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Inc|Corp|LLC|Ltd|Company|Corporation)\b/g,
      /\b(Apple|Google|Microsoft|Amazon|Meta|Tesla|Netflix|Spotify|Uber|Airbnb)\b/gi
    ];

    // Extract and categorize entities
    for (const pattern of companyPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.companies.push(match[1] || match[0]);
      }
    }

    // Financial instruments
    const financialPatterns = /\b(stock|bond|ETF|mutual fund|cryptocurrency|bitcoin|ethereum|USD|EUR|GBP|JPY)\b/gi;
    let match;
    while ((match = financialPatterns.exec(text)) !== null) {
      entities.financial_instruments.push(match[0]);
    }

    // Technologies
    const techPatterns = /\b(AI|artificial intelligence|machine learning|blockchain|cloud computing|IoT|5G|quantum computing)\b/gi;
    while ((match = techPatterns.exec(text)) !== null) {
      entities.technologies.push(match[0]);
    }

    return entities;
  }

  private assessQueryComplexity(question: string, entities: any) {
    let complexity = 1;
    
    // Length factor
    if (question.length > 100) complexity += 1;
    
    // Multiple entities
    const totalEntities = Object.values(entities).flat().length;
    complexity += Math.min(totalEntities * 0.5, 2);
    
    // Question complexity indicators
    const complexIndicators = ['analyze', 'compare', 'impact', 'relationship', 'strategy', 'optimize'];
    for (const indicator of complexIndicators) {
      if (question.toLowerCase().includes(indicator)) {
        complexity += 0.5;
      }
    }
    
    return Math.min(complexity, 5);
  }

  private getApplicableRules(intents: string[], domains: string[], entities: any) {
    const rules = [];
    
    if (intents.includes('current_events')) rules.push('real-time-data-required');
    if (domains.includes('business')) rules.push('business-intelligence-mode');
    if (domains.includes('finance')) rules.push('financial-analysis-mode');
    if (entities.companies.length > 0) rules.push('company-research-mode');
    if (intents.includes('comparative')) rules.push('comparative-analysis-mode');
    
    return rules;
  }

  private async gatherComprehensiveData(analysis: any) {
    const dataSources = [];
    const searchTerms = this.extractSearchTerms(analysis);

    // Always search Wikipedia for foundational knowledge
    try {
      const wikiData = await this.searchWikipedia(searchTerms.primary);
      if (wikiData) dataSources.push({ source: 'wikipedia', domain: 'knowledge', results: [wikiData] });
    } catch (error) {
      console.error('Wikipedia search failed:', error);
    }

    // Current events if needed
    if (analysis.appliedRules.includes('real-time-data-required')) {
      try {
        if (this.APIs.newsAPI) {
          const newsData = await this.searchNews(searchTerms.primary);
          if (newsData) dataSources.push({ source: 'news', domain: 'current_events', results: newsData });
        }

        const guardianData = await this.searchGuardian(searchTerms.primary);
        if (guardianData) dataSources.push({ source: 'guardian', domain: 'current_events', results: guardianData });
        
        const hnData = await this.searchHackerNews(searchTerms.primary);
        if (hnData) dataSources.push({ source: 'hackernews', domain: 'technology', results: hnData });
      } catch (error) {
        console.error('News search failed:', error);
      }
    }

    // Business and financial data
    if (analysis.domains.includes('business') || analysis.domains.includes('finance')) {
      try {
        if (searchTerms.financial.length > 0) {
          const cryptoData = await this.searchCrypto(searchTerms.financial[0]);
          if (cryptoData) dataSources.push({ source: 'crypto', domain: 'finance', results: [cryptoData] });
        }
      } catch (error) {
        console.error('Financial search failed:', error);
      }
    }

    // Academic research if complex query
    if (analysis.complexity > 3) {
      try {
        const arxivData = await this.searchArxiv(searchTerms.primary);
        if (arxivData) dataSources.push({ source: 'arxiv', domain: 'research', results: arxivData });
      } catch (error) {
        console.error('Academic search failed:', error);
      }
    }

    // Technology-specific sources
    if (analysis.domains.includes('technology')) {
      try {
        const githubData = await this.searchGitHub(searchTerms.primary);
        if (githubData) dataSources.push({ source: 'github', domain: 'technology', results: githubData });
        
        const soData = await this.searchStackOverflow(searchTerms.primary);
        if (soData) dataSources.push({ source: 'stackoverflow', domain: 'technology', results: soData });
      } catch (error) {
        console.error('Technology search failed:', error);
      }
    }

    return dataSources;
  }

  private extractSearchTerms(analysis: any) {
    const allEntities = Object.values(analysis.entities).flat();
    return {
      primary: allEntities.slice(0, 3).join(' ') || 'general query',
      financial: analysis.entities.financial_instruments || [],
      companies: analysis.entities.companies || [],
      technologies: analysis.entities.technologies || []
    };
  }

  // Enhanced API implementations
  private async searchNews(query: string) {
    if (!this.APIs.newsAPI) return null;

    try {
      const response = await fetch(
        `${this.APIs.newsAPI}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      return data.articles?.slice(0, 3).map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        publishedAt: new Date(article.publishedAt),
        source: article.source.name,
        credibility: this.assessSourceCredibility(article.source.name)
      })) || [];
    } catch (error) {
      console.error('News API error:', error);
      return null;
    }
  }

  private async searchGuardian(query: string) {
    try {
      // Guardian API is free but rate-limited
      const response = await fetch(
        `${this.APIs.guardianAPI}/search?q=${encodeURIComponent(query)}&show-fields=body&page-size=3&api-key=test`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      return data.response?.results?.map((article: any) => ({
        title: article.webTitle,
        description: article.fields?.body?.substring(0, 300) + '...',
        url: article.webUrl,
        publishedAt: new Date(article.webPublicationDate),
        source: 'The Guardian',
        credibility: 0.85
      })) || [];
    } catch (error) {
      console.error('Guardian API error:', error);
      return null;
    }
  }

  private async searchArxiv(query: string) {
    try {
      const response = await fetch(
        `${this.APIs.arxivAPI}?search_query=all:${encodeURIComponent(query)}&start=0&max_results=3&sortBy=relevance&sortOrder=descending`
      );
      
      if (!response.ok) return null;
      
      const xmlText = await response.text();
      return this.parseArxivResults(xmlText);
    } catch (error) {
      console.error('ArXiv search failed:', error);
      return null;
    }
  }

  private parseArxivResults(xmlText: string) {
    const results = [];
    const entryRegex = /<entry>(.*?)<\/entry>/gi;
    let match;
    
    while ((match = entryRegex.exec(xmlText)) !== null && results.length < 3) {
      const entry = match[1];
      const titleMatch = entry.match(/<title>(.*?)<\/title>/i);
      const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/i);
      const linkMatch = entry.match(/<id>(.*?)<\/id>/i);
      
      if (titleMatch && summaryMatch) {
        results.push({
          title: titleMatch[1].trim().replace(/\n/g, ' '),
          summary: summaryMatch[1].trim().replace(/\n/g, ' ').substring(0, 400) + '...',
          url: linkMatch?.[1] || 'https://arxiv.org',
          source: 'arXiv',
          credibility: 0.92
        });
      }
    }
    
    return results;
  }

  private async searchWikipedia(topic: string) {
    try {
      const response = await fetch(
        `${this.APIs.wikipediaAPI}/page/summary/${encodeURIComponent(topic)}`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (!data.extract || data.extract.length < 50) return null;
      
      return {
        title: data.title,
        extract: data.extract,
        url: data.content_urls?.desktop?.page,
        credibility: 0.88
      };
    } catch (error) {
      console.error('Wikipedia search failed:', error);
      return null;
    }
  }

  private async searchHackerNews(query: string) {
    try {
      const response = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=3&numericFilters=points>10`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      return data.hits?.map((hit: any) => ({
        title: hit.title,
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        points: hit.points,
        comments: hit.num_comments,
        author: hit.author,
        createdAt: new Date(hit.created_at),
        credibility: 0.72
      })) || [];
    } catch (error) {
      console.error('HackerNews search failed:', error);
      return null;
    }
  }

  private async searchCrypto(symbol: string) {
    try {
      const searchResponse = await fetch(
        `${this.APIs.cryptoAPI}/search?query=${encodeURIComponent(symbol)}`
      );
      
      if (!searchResponse.ok) return null;
      
      const searchData = await searchResponse.json();
      if (!searchData.coins?.length) return null;
      
      const coinId = searchData.coins[0].id;
      
      const priceResponse = await fetch(
        `${this.APIs.cryptoAPI}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
      );
      
      if (!priceResponse.ok) return null;
      
      const priceData = await priceResponse.json();
      const coinData = priceData[coinId];
      
      if (!coinData) return null;
      
      return {
        name: searchData.coins[0].name,
        symbol: searchData.coins[0].symbol,
        price: coinData.usd,
        change24h: coinData.usd_24h_change,
        marketCap: coinData.usd_market_cap,
        volume24h: coinData.usd_24h_vol,
        credibility: 0.85
      };
    } catch (error) {
      console.error('Crypto search failed:', error);
      return null;
    }
  }

  private async searchGitHub(query: string) {
    try {
      const response = await fetch(
        `${this.APIs.githubAPI}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=3`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      return data.items?.map((repo: any) => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        url: repo.html_url,
        lastUpdated: new Date(repo.updated_at),
        credibility: 0.78
      })) || [];
    } catch (error) {
      console.error('GitHub search failed:', error);
      return null;
    }
  }

  private async searchStackOverflow(query: string) {
    try {
      const response = await fetch(
        `${this.APIs.stackOverflowAPI}/search/advanced?order=desc&sort=votes&q=${encodeURIComponent(query)}&site=stackoverflow`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      return data.items?.slice(0, 3).map((item: any) => ({
        title: item.title,
        tags: item.tags,
        score: item.score,
        answerCount: item.answer_count,
        viewCount: item.view_count,
        url: item.link,
        creationDate: new Date(item.creation_date * 1000),
        credibility: 0.76
      })) || [];
    } catch (error) {
      console.error('StackOverflow search failed:', error);
      return null;
    }
  }

  private assessSourceCredibility(sourceName: string): number {
    const credibilityMap: Record<string, number> = {
      'Reuters': 0.92,
      'Associated Press': 0.91,
      'BBC News': 0.90,
      'NPR': 0.89,
      'The Guardian': 0.85,
      'The New York Times': 0.84,
      'The Washington Post': 0.83,
      'CNN': 0.75,
      'Fox News': 0.70
    };
    
    return credibilityMap[sourceName] || 0.65;
  }

  private async synthesizeIntelligentResponse(question: string, analysis: any, dataSources: any[]) {
    const documents: Document[] = [];
    const sourcesUsed = [];
    let totalCredibility = 0;
    let factualClaims = 0;

    // Process all data sources
    for (const dataSource of dataSources) {
      sourcesUsed.push(dataSource.source);
      
      if (dataSource.results) {
        for (const result of dataSource.results) {
          const doc = this.createDocumentFromResult(result, dataSource);
          if (doc) {
            documents.push(doc);
            totalCredibility += result.credibility || 0.5;
            factualClaims += this.countFactualClaims(doc.content);
          }
        }
      }
    }

    // Sort documents by relevance and credibility
    documents.sort((a, b) => (b.score * 0.7 + this.parseFloat(b.meta.importance) * 0.3) - (a.score * 0.7 + this.parseFloat(a.meta.importance) * 0.3));

    // Generate comprehensive response
    let responseContent = "";
    
    if (documents.length === 0) {
      responseContent = `I searched across multiple authoritative sources but couldn't find specific current information about "${question}". This could indicate:
      
1. The topic is very recent or specialized
2. The query might benefit from different keywords
3. The information might be proprietary or not publicly available

I recommend:
- Trying alternative search terms
- Checking domain-specific databases
- Consulting specialized publications or industry reports`;
    } else {
      // Create detailed, business-grade response
      const primaryDoc = documents[0];
      responseContent = this.generateDetailedResponse(question, analysis, documents);
    }

    const confidence = documents.length > 0 ? Math.min(0.95, totalCredibility / Math.max(documents.length, 1)) : 0.1;

    return {
      content: responseContent,
      documents,
      relationships: this.generateRelationships(documents, analysis),
      sourcesUsed: [...new Set(sourcesUsed)],
      confidence,
      factualClaims,
      inferenceChains: this.generateInferenceChains(documents, analysis)
    };
  }

  private createDocumentFromResult(result: any, dataSource: any): Document | null {
    if (!result) return null;

    let content = "";
    let preview = "";
    let score = 0.5;

    switch (dataSource.source) {
      case 'wikipedia':
        content = result.extract;
        preview = content.substring(0, 200) + "...";
        score = 0.9;
        break;
        
      case 'news':
      case 'guardian':
        content = `${result.title}. ${result.description || ''}`;
        preview = result.title;
        score = 0.85;
        break;
        
      case 'arxiv':
        content = `Academic research: ${result.title}. ${result.summary}`;
        preview = result.title;
        score = 0.92;
        break;
        
      case 'hackernews':
        content = `Tech discussion: ${result.title} (${result.points} points, ${result.comments} comments)`;
        preview = result.title;
        score = 0.72;
        break;
        
      case 'crypto':
        content = `${result.name} (${result.symbol}): $${result.price} USD. 24h change: ${result.change24h?.toFixed(2)}%. Market cap: $${(result.marketCap / 1e9).toFixed(2)}B`;
        preview = `${result.name}: $${result.price}`;
        score = 0.85;
        break;
        
      case 'github':
        content = `${result.fullName}: ${result.description}. ${result.stars} stars, ${result.forks} forks. Language: ${result.language}`;
        preview = `${result.name}: ${result.description?.substring(0, 100)}`;
        score = 0.78;
        break;
        
      default:
        return null;
    }

    return {
      id: `${dataSource.source}-${Date.now()}-${Math.random()}`,
      score,
      preview,
      content,
      meta: {
        topic: dataSource.domain,
        category: dataSource.source,
        importance: score > 0.85 ? 'high' : score > 0.7 ? 'medium' : 'low',
        keywords: this.extractKeywords(content),
        domain: dataSource.domain,
        source: dataSource.source,
        timestamp: new Date().toISOString()
      }
    };
  }

  private generateDetailedResponse(question: string, analysis: any, documents: Document[]): string {
    const primaryDoc = documents[0];
    let response = "";

    // Business-grade introduction
    if (analysis.intent === 'current_events') {
      response += "Based on current market intelligence and news sources:\n\n";
    } else if (analysis.domains.includes('business') || analysis.domains.includes('finance')) {
      response += "Business analysis indicates:\n\n";
    } else if (analysis.complexity > 3) {
      response += "Comprehensive research analysis:\n\n";
    } else {
      response += "According to authoritative sources:\n\n";
    }

    // Primary information
    response += primaryDoc.content;

    // Add supporting information
    const supportingDocs = documents.slice(1, 3);
    if (supportingDocs.length > 0) {
      response += "\n\nAdditional insights:\n";
      for (const doc of supportingDocs) {
        if (doc.meta.domain !== primaryDoc.meta.domain) {
          response += `• ${doc.content}\n`;
        }
      }
    }

    // Add credibility and recency information
    response += `\n\nData compiled from ${documents.length} authoritative sources including ${[...new Set(documents.map(d => d.meta.source))].join(', ')}.`;
    
    const recentSources = documents.filter(d => {
      const docTime = new Date(d.
