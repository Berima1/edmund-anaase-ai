```typescript
import { NextRequest, NextResponse } from 'next/server';

// Types
interface Document {
  id: string;
  score: number;
  preview: string;
  meta: Record<string, any>;
}

interface GraphTriple {
  subject: string;
  predicate: string;
  object: string;
  weight: number;
}

interface TraceItem {
  type: string;
  info: Record<string, any>;
}

interface QueryResponse {
  answer: string;
  docs: Document[];
  path: GraphTriple[];
  rulesFired: string[];
  trace: TraceItem[];
}

// Simple vector similarity function
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Simple text embedding using character frequency
function simpleEmbed(text: string): number[] {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789 ';
  const vector = new Array(chars.length).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  
  for (const char of normalized) {
    const index = chars.indexOf(char);
    if (index !== -1) vector[index]++;
  }
  
  const total = vector.reduce((sum, val) => sum + val, 0);
  return total > 0 ? vector.map(val => val / total) : vector;
}

// Knowledge Base
const knowledgeBase = [
  {
    id: "ghchain-overview",
    title: "GHChain Ecosystem Overview",
    content: "GHChain is a revolutionary blockchain ecosystem designed for African financial inclusion and economic empowerment. Built on principles of community governance and tribal consensus, GHChain provides a robust infrastructure for decentralized finance applications, cross-border payments, and digital asset management. The platform leverages advanced consensus mechanisms and smart contract capabilities to ensure secure, fast, and cost-effective transactions across the African continent and beyond.",
    metadata: { topic: "ghchain", importance: "high", category: "ecosystem" }
  },
  {
    id: "gh-gold-token",
    title: "GH GOLD Token Economics and Utility",
    content: "GH GOLD (GHG) serves as the native utility token powering the entire GHChain ecosystem. Token holders can stake GHG to earn rewards, participate in governance decisions through tribal voting mechanisms, pay transaction fees at discounted rates, and access premium DeFi features. The tokenomics model includes deflationary mechanics through token burning, liquidity mining rewards, and a robust staking system that encourages long-term holding and active participation in the ecosystem governance.",
    metadata: { topic: "gh-gold", importance: "high", category: "tokenomics" }
  },
  {
    id: "goldvault-exchange",
    title: "GOLDVAULT Exchange Platform",
    content: "GOLDVAULT is a leading African cryptocurrency exchange that provides seamless trading experiences for GH GOLD and other digital assets. The platform features competitive trading fees, multiple KYC tiers tailored for African users, and direct fiat on-ramps supporting major African currencies including Naira, Cedi, and Rand. GOLDVAULT integrates deeply with the GHChain ecosystem, offering staking services, yield farming opportunities, and governance token distribution to active traders.",
    metadata: { topic: "goldvault", importance: "medium", category: "exchange" }
  },
  {
    id: "anaase-architecture",
    title: "Anaase Reasoning Engine Architecture",
    content: "Anaase represents a breakthrough in explainable AI reasoning, combining vector databases for semantic search, knowledge graphs for relationship mapping, and forward-chaining rule engines for logical inference. The system performs multi-hop reasoning across large knowledge bases, providing full traceability of its decision-making process. Anaase can ingest documents, extract entities and relationships, apply domain-specific rules, and generate contextually relevant answers with complete reasoning traces showing how conclusions were reached.",
    metadata: { topic: "anaase", importance: "high", category: "ai-architecture" }
  },
  {
    id: "defi-applications",
    title: "DeFi Applications on GHChain",
    content: "The GHChain ecosystem hosts numerous decentralized finance applications including automated market makers (AMMs), lending protocols, yield farming platforms, and synthetic asset systems. These applications leverage GH GOLD as collateral, governance token, and reward mechanism. Users can provide liquidity to earn trading fees, lend assets for interest, and participate in complex DeFi strategies while maintaining full custody of their assets through smart contract automation.",
    metadata: { topic: "defi", importance: "medium", category: "applications" }
  }
];

// Knowledge Graph (relationships)
const knowledgeGraph: Record<string, Array<{target: string, predicate: string, weight: number}>> = {
  "GH GOLD": [
    { target: "GHChain", predicate: "isTokenOf", weight: 1.0 },
    { target: "Staking", predicate: "enables", weight: 0.9 },
    { target: "Governance", predicate: "enables", weight: 0.8 },
    { target: "DeFi", predicate: "powersApplications", weight: 0.7 }
  ],
  "GOLDVAULT": [
    { target: "GH GOLD", predicate: "lists", weight: 0.9 },
    { target: "Africa", predicate: "servesRegion", weight: 0.8 },
    { target: "GHChain", predicate: "integrates", weight: 0.7 }
  ],
  "GHChain": [
    { target: "Africa", predicate: "targetsRegion", weight: 0.9 },
    { target: "DeFi", predicate: "supports", weight: 0.8 },
    { target: "CrossBorderPayments", predicate: "enables", weight: 0.7 }
  ],
  "Anaase": [
    { target: "VectorSearch", predicate: "implements", weight: 1.0 },
    { target: "KnowledgeGraph", predicate: "implements", weight: 1.0 },
    { target: "RuleEngine", predicate: "implements", weight: 0.9 },
    { target: "ExplainableAI", predicate: "provides", weight: 0.8 }
  ]
};

// Reasoning Engine Class
class ReasoningEngine {
  private embeddings: Map<string, number[]> = new Map();

  constructor() {
    // Pre-compute embeddings
    for (const doc of knowledgeBase) {
      const embedding = simpleEmbed(`${doc.title} ${doc.content}`);
      this.embeddings.set(doc.id, embedding);
    }
  }

  semanticSearch(query: string, topK: number = 5): Document[] {
    const queryEmbedding = simpleEmbed(query);
    const results: Document[] = [];

    for (const doc of knowledgeBase) {
      const docEmbedding = this.embeddings.get(doc.id)!;
      const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
      
      if (similarity > 0.1) {
        results.push({
          id: doc.id,
          score: similarity,
          preview: doc.content.length > 200 ? doc.content.substring(0, 200) + "..." : doc.content,
          meta: doc.metadata
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  extractEntities(text: string): string[] {
    const knownEntities = ['GHChain', 'GH GOLD', 'GHG', 'GOLDVAULT', 'Anaase', 'DeFi', 'Africa', 'Staking', 'Governance'];
    const found: string[] = [];

    for (const entity of knownEntities) {
      if (text.toLowerCase().includes(entity.toLowerCase())) {
        found.push(entity);
      }
    }

    return [...new Set(found)];
  }

  graphTraversal(startEntities: string[], maxDepth: number = 3): GraphTriple[] {
    const path: GraphTriple[] = [];
    const visited = new Set<string>();
    
    const traverse = (entity: string, depth: number) => {
      if (depth >= maxDepth || visited.has(entity)) return;
      
      visited.add(entity);
      const relations = knowledgeGraph[entity];
      
      if (relations) {
        for (const relation of relations) {
          path.push({
            subject: entity,
            predicate: relation.predicate,
            object: relation.target,
            weight: relation.weight
          });
          
          traverse(relation.target, depth + 1);
        }
      }
    };

    for (const entity of startEntities) {
      traverse(entity, 0);
    }

    return path.sort((a, b) => b.weight - a.weight).slice(0, 8);
  }

  applyRules(query: string, docs: Document[]): string[] {
    const rules = [
      { name: 'token-ecosystem-rule', pattern: /token.*ecosystem|ecosystem.*token/i },
      { name: 'exchange-listing-rule', pattern: /exchange.*list|list.*exchange/i },
      { name: 'defi-utility-rule', pattern: /defi.*utility|utility.*defi/i },
      { name: 'governance-voting-rule', pattern: /governance.*voting|voting.*governance/i },
      { name: 'reasoning-engine-rule', pattern: /reasoning.*engine|ai.*reasoning/i }
    ];

    const firedRules: string[] = [];
    const combinedText = `${query} ${docs.map(d => d.preview).join(' ')}`;

    for (const rule of rules) {
      if (rule.pattern.test(combinedText)) {
        firedRules.push(rule.name);
      }
    }

    return firedRules;
  }

  generateAnswer(query: string, docs: Document[], graphPath: GraphTriple[]): string {
    if (docs.length === 0 && graphPath.length === 0) {
      return `I'm analyzing your query about "${query}" through the Anaase reasoning engine. While I have limited direct matches, I'm processing the semantic patterns and knowledge relationships to provide relevant insights.`;
    }

    let answer = "";

    if (docs.length > 0) {
      const topDoc = docs[0];
      const context = topDoc.preview.replace(/\.\.\.$/, '');
      answer += `Based on semantic analysis: ${context}`;
    }

    if (graphPath.length > 0) {
      const relationships = graphPath.slice(0, 2).map(triple => 
        `${triple.subject} ${triple.predicate.replace(/([A-Z])/g, ' $1').toLowerCase()} ${triple.object}`
      );
      
      if (answer) answer += " ";
      answer += `Knowledge graph reveals: ${relationships.join('; ')}.`;
    }

    return answer || "The Anaase reasoning engine has processed your query using vector search and knowledge graph traversal.";
  }

  async query(question: string, options: Record<string, any> = {}): Promise<QueryResponse> {
    const topK = options.topK || 5;
    const maxDepth = options.maxDepth || 3;
    const trace: TraceItem[] = [];

    // Step 1: Semantic search
    trace.push({
      type: "retrieval",
      info: { question, method: "semantic_search" }
    });
    
    const docs = this.semanticSearch(question, topK);

    // Step 2: Entity extraction and graph traversal  
    const entities = this.extractEntities(question);
    let graphPath: GraphTriple[] = [];
    
    if (entities.length > 0) {
      trace.push({
        type: "graph-hop",
        info: { startEntities: entities, maxDepth }
      });
      graphPath = this.graphTraversal(entities, maxDepth);
    }

    // Step 3: Rule application
    const rulesFired = this.applyRules(question, docs);
    if (rulesFired.length > 0) {
      trace.push({
        type: "rule",
        info: { fired: rulesFired }
      });
    }

    // Step 4: Generate answer
    const answer = this.generateAnswer(question, docs, graphPath);
    
    trace.push({
      type: "synthesis",
      info: { 
        components: ["semantic_search", "graph_traversal", "rule_inference"],
        docsFound: docs.length,
        graphHops: graphPath.length,
        rulesApplied: rulesFired.length
      }
    });

    return {
      answer,
      docs,
      path: graphPath,
      rulesFired,
      trace
    };
  }
}

// Initialize reasoning engine
const reasoningEngine = new ReasoningEngine();

// API endpoint
export async function POST(request: NextRequest) {
  try {
    const { question, options } = await request.json();
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await reasoningEngine.query(question, options || {});
    return NextResponse.json(result);
  } catch (error) {
    console.error('Query API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during reasoning' },
      { status: 500 }
    );
  }
}
```
