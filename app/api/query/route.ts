import { NextResponse } from "next/server";

export const runtime = "edge"; // run at the edge as your UI indicates

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
  trace: any[]; // important for debugging / UI reasoning view
};

class MultiDomainAggregator {
  private wikipediaAPI = "https://en.wikipedia.org/api/rest_v1";
  private nasaAPI = "https://images-api.nasa.gov";
  private weatherAPI = "https://api.openweathermap.org/data/2.5";

  // tiny helper to avoid hanging
  private async fetchWithTimeout(url: string, opts: RequestInit = {}, timeout = 3500) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(id);
      return res;
    } finally {
      clearTimeout(id);
    }
  }

  // quick connectivity probe to determine if external APIs are reachable
  private async probeConnectivity() {
    const trace: any[] = [];
    const available: string[] = [];
    const errors: any[] = [];

    // Probe Wikipedia (simple summary for "Accra")
    try {
      const r = await this.fetchWithTimeout(
        `${this.wikipediaAPI}/page/summary/${encodeURIComponent("Accra")}`
      );
      if (r.ok) {
        available.push("wikipedia");
        trace.push({ api: "wikipedia", status: "ok" });
      } else {
        throw new Error(`status ${r.status}`);
      }
    } catch (err: any) {
      errors.push({ api: "wikipedia", error: String(err) });
      trace.push({ api: "wikipedia", status: "error", error: String(err) });
    }

    // Probe NASA images API
    try {
      const r = await this.fetchWithTimeout(`${this.nasaAPI}/search?q=earth&media_type=image&page=1`);
      if (r.ok) {
        available.push("nasa");
        trace.push({ api: "nasa", status: "ok" });
      } else {
        throw new Error(`status ${r.status}`);
      }
    } catch (err: any) {
      errors.push({ api: "nasa", error: String(err) });
      trace.push({ api: "nasa", status: "error", error: String(err) });
    }

    // Note: weather API requires key — we don't probe it unless key exists
    if (process.env.OPENWEATHER_API_KEY) {
      try {
        const r = await this.fetchWithTimeout(
          `${this.weatherAPI}/weather?q=Accra&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
        );
        if (r.ok) {
          available.push("openweather");
          trace.push({ api: "openweather", status: "ok" });
        } else {
          throw new Error(`status ${r.status}`);
        }
      } catch (err: any) {
        errors.push({ api: "openweather", error: String(err) });
        trace.push({ api: "openweather", status: "error", error: String(err) });
      }
    } else {
      trace.push({ api: "openweather", status: "skipped", reason: "OPENWEATHER_API_KEY not set" });
    }

    const ok = available.length > 0;
    return { ok, available, errors, trace };
  }

  async analyzeEnhancedQuery(query: string) {
    const questionLower = query?.toLowerCase?.() || "";
    const words = questionLower.split(/\s+/).filter(Boolean);
    // simple detection
    const categories = [];
    if (/(weather|temperature|climate)/i.test(questionLower)) categories.push("weather");
    if (/(who|when|where|what|history)/i.test(questionLower)) categories.push("wikipedia");
    if (/(nasa|space|planet|moon)/i.test(questionLower)) categories.push("nasa");
    // fallback
    if (categories.length === 0) categories.push("wikipedia");
    return {
      categories,
      mainTopic: words.slice(0, 3).join(" "),
      matchedPatterns: categories,
      needsRealTime: /(latest|current|today|now|price)/i.test(questionLower)
    };
  }

  private categorize(_: string[]) {
    // kept for compatibility in case you want to reuse; not used directly here
    return [];
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
      const res = await this.fetchWithTimeout(
        `${this.wikipediaAPI}/page/summary/${encodeURIComponent(topic)}`,
        {},
        4000
      );
      if (!res.ok) throw new Error("Wikipedia failed");
      const data = await res.json();
      return {
        source: "wikipedia",
        type: "reference",
        title: data.title,
        description: data.extract,
        url: data.content_urls?.desktop?.page,
        credibility: 0.9
      };
    } catch (err) {
      console.error("Wikipedia error:", err);
      return null;
    }
  }

  private processWikipediaData(data: any) {
    return `According to Wikipedia: ${data.description || data.title || ""}`.trim();
  }

  // --- Weather ---
  private async searchWeather(topic: string): Promise<SearchResult | null> {
    if (!process.env.OPENWEATHER_API_KEY) return null;
    try {
      const res = await this.fetchWithTimeout(
        `${this.weatherAPI}/weather?q=${encodeURIComponent(topic)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`,
        {},
        3500
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
          humidity: data.main?.humidity
        },
        credibility: 0.85
      };
    } catch (err) {
      console.error("Weather error:", err);
      return null;
    }
  }

  private processWeatherData(data: any) {
    const w = data.weather || {};
    return `The weather is ${w.description || "unknown"}, around ${w.temp ?? "N/A"}°C (feels like ${w.feelsLike ?? "N/A"}°C), humidity ${w.humidity ?? "N/A"}%`;
  }

  // --- NASA ---
  private async searchNASA(topic: string): Promise<SearchResult | null> {
    try {
      const res = await this.fetchWithTimeout(
        `${this.nasaAPI}/search?q=${encodeURIComponent(topic)}&media_type=image&page=1`,
        {},
        4000
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
        credibility: 0.88
      };
    } catch (err) {
      console.error("NASA error:", err);
      return null;
    }
  }

  private processNASAData(data: any) {
    return `From NASA: ${data.title || ""} ${data.description ? `– ${data.description}` : ""}`.trim();
  }

  // if external APIs cannot be reached, return a local KB fallback
  private fallbackLocalKnowledge(query: string): ConsolidatedData {
    const trace: any[] = [
      { type: "fallback", reason: "external APIs unreachable or timed out" }
    ];
    // Very small local knowledge base examples — expand as needed
    const kb: Record<string, { answer: string; source: string }[]> = {
      ghchain: [
        { answer: "GHChain is your custom blockchain design concept (tribal voting, low fees).", source: "local-kb" }
      ],
      goldvault: [
        { answer: "GOLDVAULT is the planned African exchange component (custodial + non-custodial pairing).", source: "local-kb" }
      ],
      default: [
        { answer: `I couldn't reach external data sources. Here's a local quick summary for "${query}".`, source: "local-kb" }
      ]
    };

    const key = Object.keys(kb).find(k => query.toLowerCase().includes(k)) || "default";
    const entries = kb[key];

    const sources: SearchResult[] = entries.map((e, i) => ({
      source: e.source,
      type: "local",
      title: key,
      description: e.answer,
      credibility: 0.6 + i * 0.05
    }));

    const inferenceChains = entries.map(e => e.answer);

    return {
      answer: inferenceChains.join(" "),
      sources,
      inferenceChains,
      trace
    };
  }

  // consolidate results -> final structured object
  async consolidateData(query: string, results: SearchResult[], trace: any[] = []): Promise<ConsolidatedData> {
    const consolidated: ConsolidatedData = {
      answer: "",
      sources: results,
      inferenceChains: [],
      trace: trace || []
    };

    for (const data of results) {
      if (!data) continue;
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
        default:
          segment = data.description || data.title || "";
      }
      if (segment) consolidated.inferenceChains.push(segment);
    }

    consolidated.answer = consolidated.inferenceChains.join(" | ") || "No external info found.";
    return consolidated;
  }

  // Public wrapper (single entrypoint for route)
  async handleQuery(query: string) {
    const overallTrace: any[] = [];
    const probe = await this.probeConnectivity();
    overallTrace.push({ type: "connectivityProbe", result: probe });

    // If no external API reachable, provide local fallback immediately
    if (!probe.ok) {
      const fallback = this.fallbackLocalKnowledge(query);
      // merge trace
      fallback.trace = [...(fallback.trace || []), ...overallTrace];
      return { consolidated: fallback, debug: { probe } };
    }

    // otherwise run full flow
    const analysis = await this.analyzeEnhancedQuery(query);
    overallTrace.push({ type: "analysis", result: analysis });

    const apis = this.selectRelevantAPIs(analysis.categories);
    overallTrace.push({ type: "selectedAPIs", apis });

    const results = await this.queryAPIs(apis, query);
    overallTrace.push({ type: "apiResultsSummary", count: results.length, sources: results.map(r => r.source) });

    const consolidated = await this.consolidateData(query, results, overallTrace);
    return { consolidated, debug: { probe, overallTrace } };
  }
}

// small helper to read body safely
async function readJsonSafe(req: Request) {
  try {
    const t = await req.text();
    if (!t) return {};
    return JSON.parse(t);
  } catch {
    return {};
  }
}

// GET handler (quick browser check)
// Example: GET /api/query?q=Accra
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || url.searchParams.get("query") || "Accra";
    const aggregator = new MultiDomainAggregator();
    const { consolidated, debug } = await aggregator.handleQuery(q);
    return NextResponse.json({ ok: true, query: q, result: consolidated, debug });
  } catch (err: any) {
    console.error("GET /api/query error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// POST handler (existing POST flow)
export async function POST(req: Request) {
  try {
    const body = await readJsonSafe(req);
    const q = body.query || body.q || (body.prompt ?? "");
    if (!q) {
      return NextResponse.json({ error: "Missing query in request body" }, { status: 400 });
    }

    const aggregator = new MultiDomainAggregator();
    const { consolidated, debug } = await aggregator.handleQuery(q);
    return NextResponse.json({ ok: true, query: q, result: consolidated, debug });
  } catch (err: any) {
    console.error("POST /api/query error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
  }
