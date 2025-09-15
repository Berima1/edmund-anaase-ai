// app/api/query/route.ts - FIXED BACKEND WITH WORKING WEATHER API
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

class FixedRealBackend {
  private wikipediaAPI = 'https://en.wikipedia.org/api/rest_v1';
  private newsAPI = process.env.NEWS_API_KEY ? 'https://newsapi.org/v2' : null;
  
  // Free Weather API (no key required)
  private weatherAPI = 'https://api.open-meteo.com/v1/forecast';
  private geocodingAPI = 'https://geocoding-api.open-meteo.com/v1/search';

  async query(question: string, options: Record<string, any> = {}) {
    const startTime = Date.now();
    const trace = [];

    trace.push({
      type: "enhanced-query-analysis",
      timestamp: new Date().toISOString(),
      info: { question, method: "multi_domain_analysis" }
    });

    const queryAnalysis = this.analyzeEnhancedQuery(question);
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

    const searchPromises = this.createSearchPromises(queryAnalysis, selectedAPIs);
    const results = await Promise.allSettled(searchPromises);
    const realData = this.consolidateResults(results);

    const answer = this.generateEnhancedAnswer(question, queryAnalysis, realData);
    const relatedConcepts = this.extractRelatedConcepts(realData);
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
        version: "fixed-backend-v2.1",
        dataSources: realData.sources,
        realTime: true
      }
    };
  }

  private analyzeEnhancedQuery(question: string) {
    const questionLower = question.toLowerCase();
    
    const categories = {
      weather: /weather|temperature|climate|forecast|rain|sunny|cloudy|humidity|wind/i,
      location: /in \w+|weather in|temperature in|climate in/i,
      current: /current|today|now|right now/i,
      books: /book|author|literature|novel/i,
      geography: /country|capital|population|location/i,
      tech: /programming|code|github|software/i,
      crypto: /bitcoin|cryptocurrency|crypto|ethereum/i,
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

    // Extract location for weather queries
    let location = '';
    if (detectedCategories.includes('weather') || detectedCategories.includes('location')) {
      const locationMatch = question.match(/(?:in|for)\s+([A-Za-z\s]+)(?:\?|$)/i);
      if (locationMatch) {
        location = locationMatch[1].trim();
      }
    }

    const words = question.split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['what', 'how', 'when', 'where', 'why', 'the', 'and', 'or', 'but', 'weather', 'in'].includes(word.toLowerCase()));

    return {
      mainTopic: location || words.slice(0, 3).join(' '),
      location,
      entities: words,
      category: detectedCategories[0] || 'general',
      categories: detectedCategories,
      confidence: Math.min(confidence, 0.95),
      matchedPatterns: detectedCategories,
      needsRealTime: /latest|recent|current|today|now|weather/.test(questionLower)
    };
  }

  private selectRelevantAPIs(analysis: any): string[] {
    const apiMap: Record<string, string[]> = {
      weather: ['weather', 'wikipedia'],
      location: ['weather', 'wikipedia'],
      books: ['wikipedia'],
      geography: ['wikipedia'],
      tech: ['wikipedia'],
      crypto: ['wikipedia', 'news'],
      current: ['news', 'wikipedia'],
      general: ['wikipedia']
    };

    const selectedAPIs = new Set<string>();
    
    for (const category of analysis.categories) {
      const apis = apiMap[category] || [];
      apis.forEach(api => selectedAPIs.add(api));
    }

    selectedAPIs.add('wikipedia');

    if (analysis.needsRealTime) {
      selectedAPIs.add('news');
    }

    return Array.from(selectedAPIs).slice(0, 4);
  }

  private createSearchPromises(analysis: any, selectedAPIs: string[]) {
    const promises: Promise<any>[] = [];

    for (const api of selectedAPIs) {
      switch (api) {
        case 'weather':
          if (analysis.location) {
            promises.push(this.searchWeather(analysis.location));
          }
          break;
        case 'wikipedia':
          promises.push(this.searchWikipedia(analysis.mainTopic));
          break;
        case 'news':
          if (this.newsAPI) {
            promises.push(this.searchNews(analysis.mainTopic));
          }
          break;
      }
    }

    return promises;
  }

  private async searchWeather(location: string) {
    try {
      // Step 1: Get coordinates for the location
      const geoResponse = await fetch(
        `${this.geocodingAPI}?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
      );
      
      if (!geoResponse.ok) throw new Error('Geocoding failed');
      
      const geoData = await geoResponse.json();
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('Location not found');
      }
      
      const { latitude, longitude, name, country } = geoData.results[0];
      
      // Step 2: Get weather data
      const weatherResponse = await fetch(
        `${this.weatherAPI}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`
      );
      
      if (!weatherResponse.ok) throw new Error('Weather API failed');
      
      const weatherData = await weatherResponse.json();
      const current = weatherData.current;
      const daily = weatherData.daily;
      
      // Weather code interpretation
      const getWeatherDescription = (code: number) => {
        const weatherCodes: Record<number, string> = {
          0: 'Clear sky',
          1: 'Mainly clear',
          2: 'Partly cloudy',
          3: 'Overcast',
          45: 'Foggy',
          48: 'Depositing rime fog',
          51: 'Light drizzle',
          53: 'Moderate drizzle',
          55: 'Dense drizzle',
          61: 'Slight rain',
          63: 'Moderate rain',
          65: 'Heavy rain',
          71: 'Slight snow',
          73: 'Moderate snow',
          75: 'Heavy snow',
          80: 'Slight rain showers',
          81: 'Moderate rain showers',
          82: 'Violent rain showers',
          95: 'Thunderstorm',
          96: 'Thunderstorm with slight hail',
          99: 'Thunderstorm with heavy hail'
        };
        return weatherCodes[code] || 'Unknown weather condition';
      };
      
      return {
        source: 'weather',
        location: `${name}, ${country}`,
        current: {
          temperature: current.temperature_2m,
          humidity: current.relative_humidity_2m,
          windSpeed: current.wind_speed_10m,
          condition: getWeatherDescription(current.weather_code),
          time: current.time
        },
        forecast: {
          maxTemp: daily.temperature_2m_max[0],
          minTemp: daily.temperature_2m_min[0],
          condition: getWeatherDescription(daily.weather_code[0])
        },
        credibility: 0.95,
        type: 'weather'
      };
    } catch (error) {
      console.error('Weather search error:', error);
      return {
        source: 'weather_error',
        error: error instanceof Error ? error.message : 'Weather service unavailable',
        credibility: 0.1,
        type: 'weather'
      };
    }
  }

  private async searchWikipedia(topic: string) {
    try {
      const searchResponse = await fetch(
        `${this.wikipediaAPI}/page/summary/${encodeURIComponent(topic)}`
      );
      
      if (!searchResponse.ok) {
        throw new Error('Wikipedia search failed');
      }
      
      const data = await searchResponse.json();
      
      return {
        source: 'wikipedia',
        title: data.title,
        content: data.extract,
        url: data.content_urls?.desktop?.page,
        timestamp: new Date(),
        credibility: 0.85,
        type: 'encyclopedia'
      };
    } catch (error) {
      console.error('Wikipedia search error:', error);
      return null;
    }
  }

  private async searchNews(topic: string) {
    if (!this.newsAPI) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.newsAPI}/everything?q=${encodeURIComponent(topic)}&sortBy=relevancy&pageSize=3&apiKey=${process.env.NEWS_API_KEY}`
      );
      
      if (!response.ok) throw new Error('News API failed');
      
      const data = await response.json();
      
      return {
        source: 'news',
        articles: data.articles?.slice(0, 2).map((article: any) => ({
          title: article.title,
          content: article.description,
          url: article.url,
          publishedAt: article.publishedAt,
          source: article.source.name
        })) || [],
        credibility: 0.7,
        type: 'current_events'
      };
    } catch (error) {
      console.error('News search error:', error);
      return null;
    }
  }

  private consolidateResults(results: PromiseSettledResult<any>[]): ConsolidatedData {
    const consolidated: ConsolidatedData = {
      sources: [] as string[],
      documents: [] as Document[],
      relationships: [] as any[],
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

        // Process weather data
        if (data.source === 'weather' && data.current) {
          consolidated.documents.push({
            id: 'weather-' + Date.now(),
            score: 0.95,
            preview: `Current weather in ${data.location}: ${data.current.temperature}°C, ${data.current.condition}`,
            content: `Current weather in ${data.location}: Temperature ${data.current.temperature}°C, ${data.current.condition}, Humidity ${data.current.humidity}%, Wind speed ${data.current.windSpeed} km/h. Today's forecast: High ${data.forecast.maxTemp}°C, Low ${data.forecast.minTemp}°C, ${data.forecast.condition}.`,
            meta: {
              topic: 'weather',
              category: 'current_conditions',
              importance: 'high',
              keywords: [data.location, 'weather', 'temperature'],
              domain: 'meteorology'
            }
          });
          consolidated.domains.add('meteorology');
          consolidated.complexity += 2;
        }

        // Process weather error
        if (data.source === 'weather_error') {
          consolidated.documents.push({
            id: 'weather-error-' + Date.now(),
            score: 0.1,
            preview: `Weather information unavailable: ${data.error}`,
            content: `I couldn't retrieve current weather information: ${data.error}. Please check the location spelling or try again later.`,
            meta: {
              topic: 'weather',
              category: 'error',
              importance: 'low',
              keywords: ['weather', 'error'],
              domain: 'meteorology'
            }
          });
          consolidated.domains.add('meteorology');
          consolidated.complexity += 1;
        }

        // Process Wikipedia data
        if (data.source === 'wikipedia' && data.content) {
          consolidated.documents.push({
            id: 'wiki-' + Date.now(),
            score: 0.85,
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
          consolidated.domains.add('encyclopedia');
          consolidated.complexity += 2;
        }

        // Process news data
        if (data.source === 'news' && data.articles) {
          for (const article of data.articles || []) {
            consolidated.documents.push({
              id: 'news-' + Date.now() + Math.random(),
              score: 0.7,
              preview: article.content?.substring(0, 200) + '...' || article.title,
              content: article.content || article.title,
              meta: {
                topic: 'current_events',
                category: 'news',
                importance: 'medium',
                keywords: article.title.split(' ').slice(0, 5),
                domain: 'current_events'
              }
            });
          }
          consolidated.domains.add('current_events');
          consolidated.complexity += 1;
        }
      }
    }

    consolidated.confidence = validResults > 0 ? Math.min(0.95, validResults * 0.25 + 0.25) : 0.1;
    consolidated.totalResults = consolidated.documents.length;
    consolidated.inferenceChains = consolidated.documents.slice(0, 3).map(doc => 
      `${doc.meta.domain}: ${doc.meta.topic} → ${doc.meta.category}`
    );

    return consolidated;
  }

  private generateEnhancedAnswer(question: string, analysis: any, realData: ConsolidatedData): string {
    if (realData.documents.length === 0) {
      return "I searched across multiple data sources but couldn't find specific information about this topic. Please check if the query is correctly formatted or try rephrasing it.";
    }

    const sortedDocs = realData.documents.sort((a, b) => b.score - a.score);
    const primaryDoc = sortedDocs[0];

    // Handle weather-specific responses
    if (primaryDoc.meta.domain === 'meteorology') {
      if (primaryDoc.meta.category === 'error') {
        return primaryDoc.content;
      } else {
        let answer = primaryDoc.content;
        
        // Add additional context if available
        if (sortedDocs.length > 1) {
          const additionalInfo = sortedDocs.slice(1, 2)
            .filter(doc => doc.meta.domain !== 'meteorology')
            .map(doc => doc.content.substring(0, 150))
            .join(' ');
          
          if (additionalInfo) {
            answer += `\n\nAdditional context: ${additionalInfo}`;
          }
        }
        
        answer += "\n\nWeather data provided by Open-Meteo, a free weather API service.";
        return answer;
      }
    }

    // Handle other types of responses
    let answer = primaryDoc.content;

    if (sortedDocs.length > 1) {
      const supportingDocs = sortedDocs.slice(1, 2);
      if (supportingDocs.length > 0) {
        answer += `\n\nAdditional information: ${supportingDocs.map(doc => doc.content.substring(0, 150)).join(' ')}`;
      }
    }

    if (realData.confidence > 0.8) {
      answer += `\n\nInformation compiled from ${realData.sources.length} sources.`;
    }

    return answer;
  }

  private extractRelatedConcepts(realData: ConsolidatedData): string[] {
    const concepts = new Set<string>();
    
    for (const doc of realData.documents) {
      doc.meta.keywords.forEach((keyword: string) => {
        if (keyword.length > 3) {
          concepts.add(keyword);
        }
      });
      concepts.add(doc.meta.domain);
      concepts.add(doc.meta.category);
    }
    
    return Array.from(concepts).slice(0, 8);
  }

  private generateSmartFollowUps(question: string, realData: ConsolidatedData): string[] {
    const followUps: string[] = [];
    const domains = Array.from(realData.domains);
    
    for (const domain of domains.slice(0, 2)) {
      switch (domain) {
        case 'meteorology':
          followUps.push("What's the weather forecast for this week?");
          followUps.push("How does this compare to typical weather patterns?");
          break;
        case 'encyclopedia':
          followUps.push("Tell me more about this topic");
          followUps.push("What are the key facts I should know?");
          break;
        case 'current_events':
          followUps.push("What are the latest developments?");
          break;
      }
    }
    
    if (followUps.length < 3) {
      followUps.push("How does this relate to other topics?");
      followUps.push("Can you provide more details?");
    }
    
    return followUps.slice(0, 4);
  }
}

const fixedBackend = new FixedRealBackend();

export async function POST(request: NextRequest) {
  try {
    const { question, options } = await request.json();
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await fixedBackend.query(question, options || {});
    return NextResponse.json(result);
  } catch (error) {
    console.error('Fixed Backend API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during data processing',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'operational',
    service: 'fixed-weather-backend',
    version: '2.1.0',
    dataSources: {
      wikipedia: 'active',
      weather: 'active (Open-Meteo - no API key required)',
      news: process.env.NEWS_API_KEY ? 'active' : 'inactive'
    },
    capabilities: {
      currentWeather: true,
      locationBasedQueries: true,
      encyclopedicKnowledge: true,
      currentEvents: process.env.NEWS_API_KEY ? true : false
    },
    timestamp: new Date().toISOString()
  });
      }
