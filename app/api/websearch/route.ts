// app/api/websearch/route.ts - Independent Web Search System
import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  timestamp: Date;
  relevanceScore: number;
  source: string;
  credibility: number;
}

interface SearchResponse {
  results: SearchResult[];
  synthesizedAnswer: string;
  sources: string[];
  confidence: number;
  searchStrategy: string;
  factCheck: FactCheckResult[];
}

interface FactCheckResult {
  claim: string;
  verdict: 'verified' | 'disputed' | 'unverified';
  sources: string[];
  confidence: number;
}

class IndependentWebSearch {
  private searchProviders = [
    'duckduckgo', // Privacy-focused
    'bing',       // Microsoft (free API)
    'searx',      // Open source
    'yandex',     // Russian (different perspective)
    'baidu'       // Chinese (different perspective)
  ];

  async search(query: string, options: {
    providers?: string[];
    maxResults?: number;
    timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
    language?: string;
    region?: string;
  } = {}): Promise<SearchResponse> {
    
    const {
      providers = ['duckduckgo', 'bing'],
      maxResults = 10,
      timeRange = 'month',
      language = 'en',
      region = 'global'
    } = options;

    // Multi-provider search
    const searchPromises = providers.map(provider => 
      this.searchProvider(provider, query, { maxResults, timeRange, language, region })
    );

    const providerResults = await Promise.allSettled(searchPromises);
    
    // Combine and deduplicate results
    const allResults: SearchResult[] = [];
    for (const result of providerResults) {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      }
    }

    // Remove duplicates and rank results
    const uniqueResults = this.deduplicateAndRank(allResults);
    
    // Fact-check important claims
    const factCheck = await this.performFactCheck(query, uniqueResults);
    
    // Generate synthesized answer
    const synthesizedAnswer = await this.synthesizeAnswer(query, uniqueResults, factCheck);
    
    return {
      results: uniqueResults.slice(0, maxResults),
      synthesizedAnswer,
      sources: uniqueResults.slice(0, 5).map(r => r.url),
      confidence: this.calculateConfidence(uniqueResults, factCheck),
      searchStrategy: `Multi-provider: ${providers.join(', ')}`,
      factCheck
    };
  }

  private async searchProvider(
    provider: string, 
    query: string, 
    options: any
  ): Promise<SearchResult[]> {
    
    switch (provider) {
      case 'duckduckgo':
        return this.searchDuckDuckGo(query, options);
      case 'bing':
        return this.searchBing(query, options);
      case 'searx':
        return this.searchSearx(query, options);
      default:
        return [];
    }
  }

  private async searchDuckDuckGo(query: string, options: any): Promise<SearchResult[]> {
    try {
      // DuckDuckGo Instant Answer API (free)
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
      );
      
      const data = await response.json();
      const results: SearchResult[] = [];
      
      // Process instant answer
      if (data.AbstractText) {
        results.push({
          title: data.Heading || 'DuckDuckGo Instant Answer',
          url: data.AbstractURL || 'https://duckduckgo.com',
          snippet: data.AbstractText,
          timestamp: new Date(),
          relevanceScore: 0.9,
          source: 'duckduckgo',
          credibility: 0.8
        });
      }
      
      // Process related topics
      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, 5)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Related Topic',
              url: topic.FirstURL,
              snippet: topic.Text,
              timestamp: new Date(),
              relevanceScore: 0.7,
              source: 'duckduckgo',
              credibility: 0.7
            });
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      return [];
    }
  }

  private async searchBing(query: string, options: any): Promise<SearchResult[]> {
    // Note: Requires Bing Search API key (has free tier)
    const apiKey = process.env.BING_SEARCH_API_KEY;
    if (!apiKey) {
      return this.fallbackSearch(query, 'bing');
    }

    try {
      const response = await fetch(
        `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=10`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey
          }
        }
      );
      
      const data = await response.json();
      
      return (data.webPages?.value || []).map((item: any) => ({
        title: item.name,
        url: item.url,
        snippet: item.snippet,
        timestamp: new Date(item.dateLastCrawled || Date.now()),
        relevanceScore: item.displayUrl.includes('wikipedia') ? 0.9 : 0.7,
        source: 'bing',
        credibility: this.assessCredibility(item.url)
      }));
      
    } catch (error) {
      console.error('Bing search error:', error);
      return this.fallbackSearch(query, 'bing');
    }
  }

  private async searchSearx(query: string, options: any): Promise<SearchResult[]> {
    // Searx is open-source and has public instances
    const searxInstances = [
      'https://searx.tiekoetter.com',
      'https://searx.be',
      'https://searx.info'
    ];

    for (const instance of searxInstances) {
      try {
        const response = await fetch(
          `${instance}/search?q=${encodeURIComponent(query)}&format=json&engines=google,bing,duckduckgo`
        );
        
        const data = await response.json();
        
        return (data.results || []).slice(0, 10).map((item: any) => ({
          title: item.title,
          url: item.url,
          snippet: item.content || item.title,
          timestamp: new Date(),
          relevanceScore: 0.6,
          source: 'searx',
          credibility: this.assessCredibility(item.url)
        }));
        
      } catch (error) {
        console.error(`Searx instance ${instance} error:`, error);
        continue;
      }
    }
    
    return [];
  }

  private fallbackSearch(query: string, provider: string): SearchResult[] {
    // Fallback to known reliable sources when APIs fail
    const fallbackSources = [
      {
        title: `Search results for "${query}" - ${provider}`,
        url: `https://www.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        snippet: `Fallback search result for ${query}. This appears when external search APIs are unavailable.`,
        timestamp: new Date(),
        relevanceScore: 0.5,
        source: provider,
        credibility: 0.6
      }
    ];
    
    return fallbackSources;
  }

  private deduplicateAndRank(results: SearchResult[]): SearchResult[] {
    // Remove duplicates based on URL similarity
    const uniqueResults = new Map<string, SearchResult>();
    
    for (const result of results) {
      const normalizedUrl = this.normalizeUrl(result.url);
      if (!uniqueResults.has(normalizedUrl) || 
          result.relevanceScore > uniqueResults.get(normalizedUrl)!.relevanceScore) {
        uniqueResults.set(normalizedUrl, result);
      }
    }
    
    // Sort by composite score (relevance + credibility + recency)
    return Array.from(uniqueResults.values()).sort((a, b) => {
      const scoreA = a.relevanceScore * 0.5 + a.credibility * 0.3 + this.recencyScore(a.timestamp) * 0.2;
      const scoreB = b.relevanceScore * 0.5 + b.credibility * 0.3 + this.recencyScore(b.timestamp) * 0.2;
      return scoreB - scoreA;
    });
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  }

  private recencyScore(timestamp: Date): number {
    const ageInDays = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - (ageInDays / 365)); // Score decreases over a year
  }

  private assessCredibility(url: string): number {
    const domain = new URL(url).hostname.toLowerCase();
    
    // High credibility sources
    const highCredibility = [
      'wikipedia.org', 'britannica.com', 'nature.com', 'science.org',
      'ieee.org', 'acm.org', 'nih.gov', 'gov.uk', 'edu'
    ];
    
    // Medium credibility sources
    const mediumCredibility = [
      'bbc.com', 'reuters.com', 'ap.org', 'npr.org',
      'theguardian.com', 'nytimes.com', 'wsj.com'
    ];
    
    // Low credibility indicators
    const lowCredibility = [
      'blog', 'forum', 'reddit.com', 'quora.com', 'yahoo.com'
    ];
    
    if (highCredibility.some(source => domain.includes(source))) return 0.9;
    if (mediumCredibility.some(source => domain.includes(source))) return 0.7;
    if (lowCredibility.some(source => domain.includes(source))) return 0.4;
    
    return 0.6; // Default credibility
  }

  private async performFactCheck(query: string, results: SearchResult[]): Promise<FactCheckResult[]> {
    const factChecks: FactCheckResult[] = [];
    
    // Extract claims from query
    const claims = this.extractClaims(query);
    
    for (const claim of claims) {
      const verification = await this.verifyClaim(claim, results);
      factChecks.push(verification);
    }
    
    return factChecks;
  }

  private extractClaims(query: string): string[] {
    // Simple claim extraction - in production, use more sophisticated NLP
    const claims: string[] = [];
    
    // Look for factual statements
    const factualPatterns = [
      /is (.+)/gi,
      /was (.+)/gi,
      /has (.+)/gi,
      /will (.+)/gi,
      /can (.+)/gi
    ];
    
    for (const pattern of factualPatterns) {
      const matches = query.match(pattern);
      if (matches) {
        claims.push(...matches);
      }
    }
    
    return claims.length > 0 ? claims : [query];
  }

  private async verifyClaim(claim: string, results: SearchResult[]): Promise<FactCheckResult> {
    const supportingSources: string[] = [];
    const disputingSources: string[] = [];
    
    for (const result of results.slice(0, 5)) {
      if (this.claimSupported(claim, result.snippet)) {
        supportingSources.push(result.url);
      } else if (this.claimDisputed(claim, result.snippet)) {
        disputingSources.push(result.url);
      }
    }
    
    let verdict: 'verified' | 'disputed' | 'unverified';
    let confidence: number;
    
    if (supportingSources.length >= 2 && disputingSources.length === 0) {
      verdict = 'verified';
      confidence = Math.min(0.9, supportingSources.length * 0.3);
    } else if (disputingSources.length > supportingSources.length) {
      verdict = 'disputed';
      confidence = Math.min(0.8, disputingSources.length * 0.2);
    } else {
      verdict = 'unverified';
      confidence = 0.3;
    }
    
    return {
      claim,
      verdict,
      sources: [...supportingSources, ...disputingSources],
      confidence
    };
  }

  private claimSupported(claim: string, text: string): boolean {
    // Simple text matching - in production, use semantic similarity
    const claimWords = claim.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();
    
    return claimWords.filter(word => word.length > 3).some(word => 
      textLower.includes(word)
    );
  }

  private claimDisputed(claim: string, text: string): boolean {
    // Look for contradiction indicators
    const contradictionWords = ['not', 'false', 'incorrect', 'wrong', 'disputed', 'debunked'];
    const textLower = text.toLowerCase();
    
    return contradictionWords.some(word => textLower.includes(word)) &&
           this.claimSupported(claim, text);
  }

  private async synthesizeAnswer(
    query: string, 
    results: SearchResult[], 
    factCheck: FactCheckResult[]
  ): Promise<string> {
    if (results.length === 0) {
      return "I wasn't able to find current information about this topic. This might be a very recent development or a specialized topic that requires different search approaches.";
    }
    
    let answer = "";
    
    // Start with the most relevant result
    const topResult = results[0];
    answer += `Based on current web sources: ${topResult.snippet}`;
    
    // Add fact-check information
    const verifiedFacts = factCheck.filter(fc => fc.verdict === 'verified');
    const disputedFacts = factCheck.filter(fc => fc.verdict === 'disputed');
    
    if (verifiedFacts.length > 0) {
      answer += `\n\nVerified information: This appears to be supported by multiple reliable sources.`;
    }
    
    if (disputedFacts.length > 0) {
      answer += `\n\nNote: Some aspects of this information are disputed or contradicted by other sources.`;
    }
    
    // Add diverse perspectives if available
    if (results.length > 1) {
      const perspectives = results.slice(1, 3)
        .filter(r => r.snippet.length > 50)
        .map(r => r.snippet.substring(0, 100) + "...");
      
      if (perspectives.length > 0) {
        answer += `\n\nAdditional perspectives: ${perspectives.join(' ')}`;
      }
    }
    
    // Add recency note
    const recentResults = results.filter(r => 
      (Date.now() - r.timestamp.getTime()) < 7 * 24 * 60 * 60 * 1000 // Last week
    );
    
    if (recentResults.length > 0) {
      answer += `\n\nThis includes recent information from the past week.`;
    }
    
    return answer;
  }

  private calculateConfidence(results: SearchResult[], factCheck: FactCheckResult[]): number {
    if (results.length === 0) return 0.1;
    
    // Base confidence on result quality
    const avgCredibility = results.reduce((sum, r) => sum + r.credibility, 0) / results.length;
    const avgRelevance = results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length;
    
    // Factor in fact-checking
    const factCheckBonus = factCheck.filter(fc => fc.verdict === 'verified').length * 0.1;
    const factCheckPenalty = factCheck.filter(fc => fc.verdict === 'disputed').length * 0.1;
    
    const confidence = (avgCredibility * 0.4 + avgRelevance * 0.4 + factCheckBonus - factCheckPenalty) * 0.2;
    
    return Math.max(0.1, Math.min(0.9, confidence));
  }
}

// API endpoint
const webSearch = new IndependentWebSearch();

export async function POST(request: NextRequest) {
  try {
    const { query, options } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    const searchResults = await webSearch.search(query, options || {});
    
    return NextResponse.json({
      ...searchResults,
      metadata: {
        timestamp: new Date().toISOString(),
        query,
        version: "web-search-v1.0"
      }
    });

  } catch (error) {
    console.error('Web search error:', error);
    return NextResponse.json(
      { error: 'Internal server error during web search' },
      { status: 500 }
    );
  }
}
