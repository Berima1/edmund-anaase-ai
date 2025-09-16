// app/api/query/route.ts - SIMPLIFIED BACKEND WITH WORKING APIs
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
  };
}

interface ConsolidatedData {
  sources: string[];
  documents: Document[];
  relationships: any[];
  domains: Set<string>;
  complexity: number;
  confidence: number;
  totalResults: number;
  inferenceChains: string[];
}

class WorkingAPIsBackend {
  // Only use APIs that actually work reliably
  private wikipediaAPI = 'https://en.wikipedia.org/api/rest_v1';
  private newsAPI = process.env.NEWS_API_KEY ? 'https://newsapi.org/v2' : null;
  private weatherAPI = 'https://api.open-meteo.com/v1/forecast';
  private geocodingAPI = 'https://geocoding-api.open-meteo.com/v1/search';
  
  // Working free APIs
  private quotesAPI = 'https://api.quotable.io';
  private hackerNewsAPI = 'https://hacker-news.firebaseio.com/v0';
  private redditAPI = 'https://www.reddit.com';
  private cryptoAPI = 'https://api.coingecko.com/api/v3';

  async query(question: string, options: Record<string, any> = {}) {
    const startTime = Date.now();
    const trace = [];

    trace.push({
      type: "query-analysis",
      timestamp: new Date().toISOString(),
      info: { question, method: "pattern_matching" }
    });

    const queryAnalysis = this.analyzeQuery(question);
    const selectedAPIs = this.selectWorkingAPIs(queryAnalysis);
    
    trace.push({
      type: "api-selection",
      timestamp: new Date().toISOString(),
      info: { 
        selectedAPIs,
        queryType: queryAnalysis.category,
        location: queryAnalysis.location
      }
    });

    // Only call APIs that we know work
    const searchPromises = this.createWorkingSearches(queryAnalysis, selectedAPIs);
    const results = await Promise.allSettled(searchPromises);
    const realData = this.consolidateResults(results);

    const answer = this.generateAnswer(question, queryAnalysis, realData);
    const relatedConcepts = this.extractConcepts(realData);
    const alternativeQuestions = this.generateFollowUps(question, realData);

    const processingTime = Date.now() - startTime;
    trace.push({
      type: "data-synthesis",
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
        version: "working-apis-v1.0",
        dataSources: realData.sources,
        realTime: true
      }
    };
  }

  private analyzeQuery(question: string) {
    const questionLower = question.toLowerCase();
    
    const patterns = {
      weather: /weather|temperature|climate|forecast|rain|sunny|cloudy/i,
      news: /news|latest|recent|updates|current events|headlines/i,
      crypto: /bitcoin|cryptocurrency|crypto|ethereum|price|btc|eth/i,
      tech: /tech|technology|programming|software|hacker news/i,
      quotes: /quote|inspiration|wisdom|saying|motivational/i,
      social: /reddit|discussion|opinion|community/i,
      definition: /what is|define|explain|meaning/i,
      general: /./
    };

    const detectedCategories: string[] = [];
    
    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(questionLower)) {
        detectedCategories.push(category);
      }
    }

    // Extract location for weather
    let location = '';
    if (detectedCategories.includes('weather')) {
      const locationMatch = question.match(/(?:in|for|at)\s+([A-Za-z\s,]+)(?:\?|$)/i);
      if (locationMatch) {
        location = locationMatch[1].trim();
      }
    }

    // Extract search terms
    const words = question.split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['what', 'how', 'when', 'where', 'why', 'the', 'and', 'or', 'in', 'for', 'is'].includes(word.toLowerCase()));

    return {
      mainTopic: words.slice(0, 3).join(' '),
      location,
      entities: words,
      category: detectedCategories[0] || 'general',
      categories: detectedCategories,
      matchedPatterns: detectedCategories
    };
  }

  private selectWorkingAPIs(analysis: any): string[] {
    const selectedAPIs = new Set<string>();

    // Always include Wikipedia as it's very reliable
    selectedAPIs.add('wikipedia');

    // Add specific APIs based on query type
    if (analysis.categories.includes('weather') && analysis.location) {
      selectedAPIs.add('weather');
    }
    
    if (analysis.categories.includes('news')) {
      if (this.newsAPI) {
        selectedAPIs.add('news');
      }
      selectedAPIs.add('hackernews'); // Backup for tech news
    }
    
    if (analysis.categories.includes('crypto')) {
      selectedAPIs.add('crypto');
    }
    
    if (analysis.categories.includes('tech')) {
      selectedAPIs.add('hackernews');
    }
    
    if (analysis.categories.includes('quotes')) {
      selectedAPIs.add('quotes');
    }
    
    if (analysis.categories.includes('social')) {
      selectedAPIs.add('reddit');
    }

    return Array.from(selectedAPIs);
  }

  private createWorkingSearches(analysis: any, selectedAPIs: string[]) {
    const promises: Promise<any>[] = [];

    for (const api of selectedAPIs) {
      switch (api) {
        case 'wikipedia':
          promises.push(this.searchWikipedia(analysis.mainTopic));
          break;
        case 'weather':
          promises.push(this.searchWeather(analysis.location));
          break;
        case 'news':
          promises.push(this.searchNews(analysis.mainTopic));
          break;
        case 'hackernews':
          promises.push(this.searchHackerNews(analysis.mainTopic));
          break;
        case 'crypto':
          promises.push(this.searchCrypto(analysis.mainTopic));
          break;
        case 'quotes':
          promises.push(this.searchQuotes(analysis.mainTopic));
          break;
        case 'reddit':
          promises.push(this.searchReddit(analysis.mainTopic));
          break;
      }
    }

    return promises;
  }

  // Working API implementations
  private async searchWikipedia(topic: string) {
    try {
      const searchResponse = await fetch(
        `${this.wikipediaAPI}/page/summary/${encodeURIComponent(topic)}`
      );
      
      if (!searchResponse.ok) {
        return null;
      }
      
      const data = await searchResponse.json();
      
      return {
        source: 'wikipedia',
        title: data.title,
        content: data.extract || 'No summary available',
        url: data.content_urls?.desktop?.page,
        credibility: 0.9,
        type: 'encyclopedia'
      };
    } catch (error) {
      console.error('Wikipedia error:', error);
      return null;
    }
  }

  private async searchWeather(location: string) {
    try {
      // Get coordinates
      const geoResponse = await fetch(
        `${this.geocodingAPI}?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
      );
      
      if (!geoResponse.ok) return null;
      
      const geoData = await geoResponse.json();
      if (!geoData.results || geoData.results.length === 0) {
        return null;
      }
      
      const { latitude, longitude, name, country } = geoData.results[0];
      
      // Get weather
      const weatherResponse = await fetch(
        `${this.weatherAPI}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
      );
      
      if (!weatherResponse.ok) return null;
      
      const weatherData = await weatherResponse.json();
      const current = weatherData.current;
      
      const getWeatherDescription = (code: number) => {
        const codes: Record<number, string> = {
          0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
          45: 'Foggy', 51: 'Light drizzle', 61: 'Light rain', 63: 'Moderate rain',
          65: 'Heavy rain', 71: 'Light snow', 80: 'Rain showers', 95: 'Thunderstorm'
        };
        return codes[code] || 'Unknown weather';
      };
      
      return {
        source: 'weather',
        location: `${name}, ${country}`,
        temperature: current.temperature_2m,
        condition: getWeatherDescription(current.weather_code),
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        credibility: 0.95,
        type: 'weather'
      };
    } catch (error) {
      console.error('Weather error:', error);
      return null;
    }
  }

  private async searchNews(topic: string) {
    if (!this.newsAPI) return null;

    try {
      const response = await fetch(
        `${this.newsAPI}/everything?q=${encodeURIComponent(topic)}&sortBy=publishedAt&pageSize=3&apiKey=${process.env.NEWS_API_KEY}`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      return {
        source: 'news',
        articles: data.articles?.slice(0, 3).map((article: any) => ({
          title: article.title,
          description: article.description,
          url: article.url,
          publishedAt: article.publishedAt,
          sourceName: article.source.name
        })) || [],
        credibility: 0.8,
        type: 'news'
      };
    } catch (error) {
      console.error('News error:', error);
      return null;
    }
  }

  private async searchHackerNews(topic: string) {
    try {
      // Search HN using their API
      const searchResponse = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(topic)}&tags=story&hitsPerPage=3`
      );
      
      if (!searchResponse.ok) return null;
      
      const data = await searchResponse.json();
      
      return {
        source: 'hackernews',
        stories: data.hits?.map((hit: any) => ({
          title: hit.title,
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          points: hit.points,
          numComments: hit.num_comments,
          author: hit.author
        })) || [],
        credibility: 0.7,
        type: 'tech_news'
      };
    } catch (error) {
      console.error('HackerNews error:', error);
      return null;
    }
  }

  private async searchCrypto(topic: string) {
    try {
      // Search coins
      const searchResponse = await fetch(
        `${this.cryptoAPI}/search?query=${encodeURIComponent(topic)}`
      );
      
      if (!searchResponse.ok) return null;
      
      const searchData = await searchResponse.json();
      
      if (searchData.coins?.length > 0) {
        const coinId = searchData.coins[0].id;
        
        // Get price data
        const priceResponse = await fetch(
          `${this.cryptoAPI}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
        );
        
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          const price = priceData[coinId];
          
          return {
            source: 'crypto',
            coin: searchData.coins[0],
            price: price?.usd,
            change24h: price?.usd_24h_change,
            credibility: 0.8,
            type: 'cryptocurrency'
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Crypto error:', error);
      return null;
    }
  }

  private async searchQuotes(topic: string) {
    try {
      const response = await fetch(
        `${this.quotesAPI}/quotes?tags=${encodeURIComponent(topic)}&limit=2`
      );
      
      if (!response.ok) {
        // Fallback to random quotes if no topic matches
        const fallbackResponse = await fetch(`${this.quotesAPI}/quotes/random`);
        if (fallbackResponse.ok) {
          const quote = await fallbackResponse.json();
          return {
            source: 'quotes',
            quotes: [quote],
            credibility: 0.6,
            type: 'wisdom'
          };
        }
        return null;
      }
      
      const data = await response.json();
      
      return {
        source: 'quotes',
        quotes: data.results || [],
        credibility: 0.7,
        type: 'wisdom'
      };
    } catch (error) {
      console.error('Quotes error:', error);
      return null;
    }
  }

  private async searchReddit(topic: string) {
    try {
      const response = await fetch(
        `${this.redditAPI}/search.json?q=${encodeURIComponent(topic)}&limit=3&sort=relevance`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      return {
        source: 'reddit',
        posts: data.data?.children?.slice(0, 2).map((child: any) => ({
          title: child.data.title,
          subreddit: child.data.subreddit,
          score: child.data.score,
          numComments: child.data.num_comments,
          url: `https://reddit.com${child.data.permalink}`
        })) || [],
        credibility: 0.5,
        type: 'social'
      };
    } catch (error) {
      console.error('Reddit error:', error);
      return null;
    }
  }

  private consolidateResults(results: PromiseSettledResult<any>[]): ConsolidatedData {
    const consolidated: ConsolidatedData = {
      sources: [],
      documents: [],
      relationships: [],
      domains: new Set<string>(),
      complexity: 0,
      confidence: 0,
      totalResults: 0,
      inferenceChains: []
    };

    let validResults = 0;

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const data = result.value;
        consolidated.sources.push(data.source);
        validResults++;

        // Process each data type
        switch (data.source) {
          case 'wikipedia':
            if (data.content && data.content !== 'No summary available') {
              consolidated.documents.push({
                id: 'wiki-' + Date.now(),
                score: 0.9,
                preview: data.content.substring(0, 200) + '...',
                content: data.content,
                meta: {
                  topic: 'encyclopedia',
                  category: 'reference',
                  importance: 'high',
                  keywords: data.title?.split(' ') || [],
                  domain: 'knowledge'
                }
              });
              consolidated.domains.add('knowledge');
              consolidated.complexity += 2;
            }
            break;

          case 'weather':
            consolidated.documents.push({
              id: 'weather-' + Date.now(),
              score: 0.95,
              preview: `Weather in ${data.location}: ${data.temperature}°C, ${data.condition}`,
              content: `Current weather in ${data.location}: ${data.temperature}°C, ${data.condition}. Humidity: ${data.humidity}%, Wind speed: ${data.windSpeed} km/h`,
              meta: {
                topic: 'weather',
                category: 'current',
                importance: 'high',
                keywords: [data.location, 'weather', 'temperature'],
                domain: 'meteorology'
              }
            });
            consolidated.domains.add('meteorology');
            consolidated.complexity += 2;
            break;

          case 'news':
            for (const article of data.articles || []) {
              consolidated.documents.push({
                id: 'news-' + Date.now() + Math.random(),
                score: 0.8,
                preview: article.description?.substring(0, 200) + '...' || article.title,
                content: `${article.title}. ${article.description || ''} (Source: ${article.sourceName})`,
                meta: {
                  topic: 'current_events',
                  category: 'news',
                  importance: 'high',
                  keywords: article.title.split(' ').slice(0, 5),
                  domain: 'news'
                }
              });
            }
            consolidated.domains.add('news');
            consolidated.complexity += 2;
            break;

          case 'hackernews':
            for (const story of data.stories || []) {
              consolidated.documents.push({
                id: 'hn-' + Date.now() + Math.random(),
                score: 0.7,
                preview: `HackerNews: ${story.title} (${story.points} points)`,
                content: `${story.title} - ${story.points} points, ${story.numComments} comments on Hacker News`,
                meta: {
                  topic: 'technology',
                  category: 'tech_news',
                  importance: 'medium',
                  keywords: story.title.split(' ').slice(0, 5),
                  domain: 'technology'
                }
              });
            }
            consolidated.domains.add('technology');
            consolidated.complexity += 1;
            break;

          case 'crypto':
            if (data.coin && data.price) {
              consolidated.documents.push({
                id: 'crypto-' + Date.now(),
                score: 0.8,
                preview: `${data.coin.name} (${data.coin.symbol}): $${data.price}`,
                content: `${data.coin.name} (${data.coin.symbol}) is currently trading at $${data.price}. 24h change: ${data.change24h?.toFixed(2)}%`,
                meta: {
                  topic: 'cryptocurrency',
                  category: 'price',
                  importance: 'medium',
                  keywords: [data.coin.name, data.coin.symbol, 'crypto'],
                  domain: 'finance'
                }
              });
              consolidated.domains.add('finance');
              consolidated.complexity += 2;
            }
            break;

          case 'quotes':
            for (const quote of data.quotes || []) {
              consolidated.documents.push({
                id: 'quote-' + Date.now() + Math.random(),
                score: 0.6,
                preview: `"${quote.content}" - ${quote.author}`,
                content: `"${quote.content}" - ${quote.author}`,
                meta: {
                  topic: 'wisdom',
                  category: 'quotes',
                  importance: 'low',
                  keywords: [quote.author],
                  domain: 'philosophy'
                }
              });
            }
            consolidated.domains.add('philosophy');
            consolidated.complexity += 1;
            break;

          case 'reddit':
            for (const post of data.posts || []) {
              consolidated.documents.push({
                id: 'reddit-' + Date.now() + Math.random(),
                score: 0.5,
                preview: `r/${post.subreddit}: ${post.title.substring(0, 100)}...`,
                content: `Discussion from r/${post.subreddit}: "${post.title}" (${post.score} upvotes, ${post.numComments} comments)`,
                meta: {
                  topic: 'social',
                  category: 'discussion',
                  importance: 'low',
                  keywords: [post.subreddit],
                  domain: 'social'
                }
              });
            }
            consolidated.domains.add('social');
            consolidated.complexity += 1;
            break;
        }
      }
    }

    consolidated.confidence = validResults > 0 ? Math.min(0.95, validResults * 0.2 + 0.3) : 0.1;
    consolidated.totalResults = consolidated.documents.length;
    consolidated.inferenceChains = consolidated.documents.slice(0, 3).map(doc => 
      `${doc.meta.domain}: ${doc.meta.topic}`
    );

    return consolidated;
  }

  private generateAnswer(question: string, analysis: any, realData: ConsolidatedData): string {
    if (realData.documents.length === 0) {
      return "I searched multiple data sources but couldn't find specific information about this topic. The APIs might be temporarily unavailable or the query might need different keywords.";
    }

    const sortedDocs = realData.documents.sort((a, b) => b.score - a.score);
    let answer = "";

    // Use the best result as primary answer
    const primaryDoc = sortedDocs[0];
    answer = primaryDoc.content;

    // Add supporting information if available
    if (sortedDocs.length > 1) {
      const supportingDocs = sortedDocs.slice(1, 2)
        .filter(doc => doc.meta.domain !== primaryDoc.meta.domain);
      
      if (supportingDocs.length > 0) {
        answer += `\n\nAdditional information: ${supportingDocs[0].content}`;
      }
    }

    // Add source information
    answer += `\n\nSources: ${realData.sources.join(', ')}`;

    return answer;
  }

  private extractConcepts(realData: ConsolidatedData): string[] {
    const concepts = new Set<string>();
    
    for (const doc of realData.documents) {
      doc.meta.keywords.forEach(keyword => {
        if (keyword.length > 3) concepts.add(keyword);
      });
      concepts.add(doc.meta.domain);
    }
    
    return Array.from(concepts).slice(0, 8);
  }

  private generateFollowUps(question: string, realData: ConsolidatedData): string[] {
    const followUps: string[] = [];
    const domains = Array.from(realData.domains);
    
    for (const domain of domains.slice(0, 2)) {
      switch (domain) {
        case 'meteorology':
          followUps.push("What's the weather forecast for tomorrow?");
          break;
        case 'news':
          followUps.push("What other recent news is there?");
          break;
        case 'technology':
          followUps.push("What are the latest tech trends?");
          break;
        case 'finance':
          followUps.push("What are other cryptocurrency prices?");
          break;
        default:
          followUps.push("Tell me more about this topic");
      }
    }
    
    if (followUps.length < 3) {
      followUps.push("Can you provide more details?");
      followUps.push("How does this relate to current events?");
    }
    
    return followUps.slice(0, 4);
  }
}

const workingBackend = new WorkingAPIsBackend();

export async function POST(request: NextRequest) {
  try {
    const { question, options } = await request.json();
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await workingBackend.query(question, options || {});
    return NextResponse.json(result);
  } catch (error) {
    console.error('Working Backend API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'operational',
    service: 'working-apis-backend',
    version: '1.0.0',
    workingAPIs: {
      wikipedia: 'active',
      weather: 'active (Open-Meteo)',
      news: process.env.NEWS_API_KEY ? 'active (NewsAPI)' : 'inactive',
      hackerNews: 'active (Algolia HN Search)',
      crypto: 'active (CoinGecko)',
      quotes: 'active (Quotable)',
      reddit: 'active (Reddit JSON)'
    },
    timestamp: new Date().toISOString()
  });
      }
