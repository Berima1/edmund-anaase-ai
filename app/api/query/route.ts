import { NextResponse } from "next/server";

type SearchResult = {
  source: string;
  type: string;
  title?: string;
  description?: string;
  url?: string;
  credibility: number;
  [key: string]: any;
};

type ConsolidatedData = {
  answer: string;
  sources: SearchResult[];
  inferenceChains: string[];
  trace: any[];
};

// --- Core Class ---
class MultiDomainAggregator {
  private wikipediaAPI = "https://en.wikipedia.org/api/rest_v1";
  private weatherAPI = "https://api.openweathermap.org/data/2.5";

  async analyzeEnhancedQuery(query: string) {
    const keywords = query.toLowerCase().split(" ");
    return { keywords, categories: this.categorize(keywords) };
  }

  private categorize(keywords: string[]) {
    const cats: string[] = [];
    if (keywords.some(k => ["weather", "temperature", "climate"].includes(k)))
      cats.push("weather");
    if (keywords.some(k => ["history", "who", "when", "where"].includes(k)))
      cats.push("wikipedia");
    if (keywords.some(k => ["nasa", "space", "moon", "planet"].includes(k)))
      cats.push("nasa");
    return cats;
  }

  private selectRelevantAPIs(categories: string[]) {
    const apis: string[] = [];
    if (categories.includes("weather")) apis.push("openweather");
    if (categories.includes("wikipedia")) apis.push("wikipedia");
    if (categories.includes("nasa")) apis.push("nasa");
    return apis;
  }

  async queryAPIs(apis: string[], query: string) {
    const results = await Promise.allSettled(
      apis.map(api => {
        switch (api) {
          case "wikipedia":
            return this.searchWikipedia(query);
          case "openweather":
            return this.searchWeather(query);
          case "nasa":
            return this.searchNASA(query);
          default:
            return Promise.resolve(null);
        }
      })
    );

    return results
      .map(r => (r.status === "fulfilled" ? r.value : null))
      .filter(Boolean) as SearchResult[];
  }

  // --- Wikipedia ---
  private async searchWikipedia(topic: string): Promise<SearchResult | null> {
    try {
      const res = await fetch(
        `${this.wikipediaAPI}/page/summary/${encodeURIComponent(topic)}`
      );
      if (!res.ok) throw new Error("Wikipedia failed");
      const data = await res.json();
      return {
        source: "wikipedia",
        type: "reference",
        title: data.title,
        description: data.extract,
        url: data.content_urls?.desktop?.page,
        credibility: 0.9,
      };
    } catch (err) {
      console.error("Wikipedia error:", err);
      return null;
    }
  }

  private processWikipediaData(data: any) {
    return `According to Wikipedia: ${data.description}`;
  }

  // --- Weather ---
  private async searchWeather(topic: string): Promise<SearchResult | null> {
    if (!process.env.OPENWEATHER_API_KEY) return null;
    try {
      const res = await fetch(
        `${this.weatherAPI}/weather?q=${encodeURIComponent(
          topic
        )}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      );
      if (!res.ok) throw new Error("Weather failed");
      const data = await res.json();
      return {
        source: "openweather",
        type: "climate",
        weather: {
          description: data.weather?.[0]?.description,
          temp: data.main?.temp,
          feelsLike: data.main?.feels_like,
          humidity: data.main?.humidity,
        },
        credibility: 0.85,
      };
    } catch (err) {
      console.error("Weather error:", err);
      return null;
    }
  }

  private processWeatherData(data: any) {
    return `The weather is ${data.weather.description}, around ${data.weather.temp}°C (feels like ${data.weather.feelsLike}°C), humidity ${data.weather.humidity}%`;
  }

  // --- NASA ---
  private async searchNASA(topic: string): Promise<SearchResult | null> {
    try {
      const res = await fetch(
        `https://images-api.nasa.gov/search?q=${encodeURIComponent(topic)}`
      );
      if (!res.ok) throw new Error("NASA failed");
      const data = await res.json();
      const first = data.collection?.items?.[0];
      return {
        source: "nasa",
        type: "space",
        title: first?.data?.[0]?.title,
        description: first?.data?.[0]?.description,
        url: first?.links?.[0]?.href,
        credibility: 0.88,
      };
    } catch (err) {
      console.error("NASA error:", err);
      return null;
    }
  }

  private processNASAData(data: any) {
    return `From NASA: ${data.title} – ${data.description}`;
  }

  // --- Final Answer Builder ---
  async consolidateData(query: string, results: SearchResult[]) {
    const consolidated: ConsolidatedData = {
      answer: "",
      sources: results,
      inferenceChains: [],
      trace: [],
    };

    for (const data of results) {
      let segment = "";
      switch (data.source) {
        case "wikipedia":
          segment = this.processWikipediaData(data);
          break;
        case "openweather":
          segment = this.processWeatherData(data);
          break;
        case "nasa":
          segment = this.processNASAData(data);
          break;
      }
      if (segment) consolidated.inferenceChains.push(segment);
    }

    consolidated.answer =
      consolidated.inferenceChains.join(" | ") ||
      "No relevant information was found.";

    return consolidated;
  }

  // --- Public wrapper (fixes your error) ---
  async handleQuery(query: string) {
    const { categories } = await this.analyzeEnhancedQuery(query);
    const apis = this.selectRelevantAPIs(categories);
    const results = await this.queryAPIs(apis, query);
    return this.consolidateData(query, results);
  }
}

// --- Next.js API Route ---
export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const aggregator = new MultiDomainAggregator();
    const consolidated = await aggregator.handleQuery(query);

    return NextResponse.json(consolidated);
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
        }
