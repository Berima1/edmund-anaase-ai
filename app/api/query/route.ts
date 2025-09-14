// Updated app/api/query/route.ts with expanded knowledge base
import { NextRequest, NextResponse } from 'next/server';

// Types (same as before)
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

// Vector similarity and embedding functions (same as before)
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

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

// MASSIVELY EXPANDED KNOWLEDGE BASE
const knowledgeBase = [
  // === ORIGINAL GHCHAIN KNOWLEDGE ===
  {
    id: "ghchain-overview",
    title: "GHChain Ecosystem Overview",
    content: "GHChain is a revolutionary blockchain ecosystem designed for African financial inclusion and economic empowerment. Built on principles of community governance and tribal consensus, GHChain provides a robust infrastructure for decentralized finance applications, cross-border payments, and digital asset management.",
    metadata: { topic: "ghchain", importance: "high", category: "blockchain" }
  },
  {
    id: "gh-gold-token",
    title: "GH GOLD Token Economics",
    content: "GH GOLD (GHG) serves as the native utility token powering the entire GHChain ecosystem. Token holders can stake GHG to earn rewards, participate in governance decisions through tribal voting mechanisms, pay transaction fees at discounted rates, and access premium DeFi features.",
    metadata: { topic: "gh-gold", importance: "high", category: "cryptocurrency" }
  },
  {
    id: "goldvault-exchange",
    title: "GOLDVAULT Exchange Platform",
    content: "GOLDVAULT is a leading African cryptocurrency exchange that provides seamless trading experiences for GH GOLD and other digital assets. The platform features competitive trading fees, multiple KYC tiers tailored for African users, and direct fiat on-ramps.",
    metadata: { topic: "goldvault", importance: "medium", category: "exchange" }
  },

  // === ARTIFICIAL INTELLIGENCE ===
  {
    id: "ai-fundamentals",
    title: "Artificial Intelligence Fundamentals",
    content: "Artificial Intelligence (AI) refers to computer systems that can perform tasks typically requiring human intelligence. This includes machine learning, natural language processing, computer vision, and reasoning. AI systems learn from data, recognize patterns, and make predictions or decisions. Modern AI includes neural networks, deep learning, and transformer models like GPT.",
    metadata: { topic: "artificial-intelligence", importance: "high", category: "technology" }
  },
  {
    id: "machine-learning",
    title: "Machine Learning and Neural Networks",
    content: "Machine learning is a subset of AI where computers learn patterns from data without explicit programming. Neural networks mimic brain structure with interconnected nodes. Deep learning uses multiple layers to process complex data. Common applications include image recognition, natural language processing, recommendation systems, and predictive analytics.",
    metadata: { topic: "machine-learning", importance: "high", category: "technology" }
  },
  {
    id: "nlp-language-models",
    title: "Natural Language Processing and Large Language Models",
    content: "Natural Language Processing (NLP) enables computers to understand and generate human language. Large Language Models (LLMs) like GPT, Claude, and BERT are trained on vast text datasets. They can perform translation, summarization, question-answering, code generation, and creative writing through transformer architectures.",
    metadata: { topic: "nlp", importance: "high", category: "ai" }
  },

  // === BLOCKCHAIN & CRYPTOCURRENCY ===
  {
    id: "blockchain-basics",
    title: "Blockchain Technology Fundamentals",
    content: "Blockchain is a distributed ledger technology that maintains a continuously growing list of records (blocks) linked using cryptography. Each block contains a hash of the previous block, timestamp, and transaction data. Blockchain provides decentralization, immutability, transparency, and security without requiring trusted intermediaries.",
    metadata: { topic: "blockchain", importance: "high", category: "technology" }
  },
  {
    id: "bitcoin-cryptocurrency",
    title: "Bitcoin and Cryptocurrency Basics",
    content: "Bitcoin is the first and largest cryptocurrency, created by Satoshi Nakamoto in 2009. It uses proof-of-work consensus and has a limited supply of 21 million coins. Cryptocurrencies are digital assets secured by cryptography, enabling peer-to-peer transactions without banks. Popular cryptocurrencies include Ethereum, Solana, Cardano, and Polygon.",
    metadata: { topic: "bitcoin", importance: "high", category: "cryptocurrency" }
  },
  {
    id: "defi-protocols",
    title: "Decentralized Finance (DeFi) Protocols",
    content: "DeFi recreates traditional financial services using blockchain technology without intermediaries. Key protocols include Uniswap (AMM), Aave (lending), Compound (interest), MakerDAO (stablecoins), and Yearn Finance (yield farming). DeFi enables lending, borrowing, trading, and earning yields through smart contracts.",
    metadata: { topic: "defi", importance: "medium", category: "blockchain" }
  },

  // === PROGRAMMING & SOFTWARE ===
  {
    id: "programming-fundamentals",
    title: "Programming and Software Development",
    content: "Programming involves writing instructions for computers using languages like Python, JavaScript, Java, C++, and Rust. Software development includes algorithms, data structures, design patterns, and software architecture. Modern development uses frameworks, version control (Git), testing, and DevOps practices for building scalable applications.",
    metadata: { topic: "programming", importance: "high", category: "technology" }
  },
  {
    id: "web-development",
    title: "Web Development Technologies",
    content: "Web development creates websites and applications using HTML, CSS, and JavaScript. Frontend frameworks include React, Vue, and Angular. Backend technologies include Node.js, Python Django, Ruby on Rails, and databases like PostgreSQL and MongoDB. Modern web development uses APIs, microservices, and cloud deployment.",
    metadata: { topic: "web-development", importance: "medium", category: "programming" }
  },
  {
    id: "cloud-computing",
    title: "Cloud Computing and Infrastructure",
    content: "Cloud computing provides on-demand computing resources over the internet. Major providers include AWS, Google Cloud, Microsoft Azure, and Vercel. Services include compute (EC2), storage (S3), databases (RDS), and serverless functions (Lambda). Cloud enables scalability, cost efficiency, and global distribution of applications.",
    metadata: { topic: "cloud-computing", importance: "medium", category: "infrastructure" }
  },

  // === SCIENCE & MATHEMATICS ===
  {
    id: "mathematics-calculus",
    title: "Mathematics and Calculus Fundamentals",
    content: "Mathematics includes algebra, geometry, trigonometry, and calculus. Calculus deals with rates of change (derivatives) and accumulation (integrals). Linear algebra covers vectors, matrices, and vector spaces. Statistics and probability are essential for data analysis and machine learning. Mathematical concepts underpin computer science and physics.",
    metadata: { topic: "mathematics", importance: "medium", category: "science" }
  },
  {
    id: "physics-quantum",
    title: "Physics and Quantum Mechanics",
    content: "Physics studies matter, energy, and their interactions. Classical mechanics describes motion and forces. Thermodynamics deals with heat and energy transfer. Quantum mechanics describes behavior at atomic scales with wave-particle duality, uncertainty principle, and quantum entanglement. Modern physics includes relativity and particle physics.",
    metadata: { topic: "physics", importance: "medium", category: "science" }
  },
  {
    id: "chemistry-biology",
    title: "Chemistry and Biology Fundamentals",
    content: "Chemistry studies atoms, molecules, and chemical reactions. Organic chemistry focuses on carbon compounds. Biochemistry bridges chemistry and biology. Biology studies living organisms, including cell structure, genetics, evolution, and ecosystems. Molecular biology examines biological processes at molecular level.",
    metadata: { topic: "chemistry-biology", importance: "medium", category: "science" }
  },

  // === BUSINESS & ECONOMICS ===
  {
    id: "business-fundamentals",
    title: "Business and Entrepreneurship",
    content: "Business involves creating value through products or services. Entrepreneurship is starting new ventures with innovation and risk-taking. Key areas include marketing, finance, operations, and strategy. Business models include B2B, B2C, SaaS, marketplace, and subscription models. Success requires market research, competitive analysis, and execution.",
    metadata: { topic: "business", importance: "medium", category: "economics" }
  },
  {
    id: "economics-markets",
    title: "Economics and Financial Markets",
    content: "Economics studies production, distribution, and consumption of goods and services. Microeconomics examines individual markets and consumer behavior. Macroeconomics studies entire economies, including inflation, unemployment, and GDP. Financial markets include stocks, bonds, commodities, and foreign exchange trading.",
    metadata: { topic: "economics", importance: "medium", category: "finance" }
  },

  // === HISTORY & PHILOSOPHY ===
  {
    id: "world-history",
    title: "World History and Civilizations",
    content: "Human history spans from ancient civilizations (Egypt, Mesopotamia, Greece, Rome) through medieval periods, Renaissance, Industrial Revolution, to modern times. Major events include world wars, technological revolutions, and social movements. History provides context for understanding current politics, culture, and social structures.",
    metadata: { topic: "history", importance: "medium", category: "humanities" }
  },
  {
    id: "philosophy-ethics",
    title: "Philosophy and Ethics",
    content: "Philosophy examines fundamental questions about existence, knowledge, values, and meaning. Major branches include metaphysics, epistemology, ethics, and logic. Ethics studies moral principles and right conduct. Famous philosophers include Aristotle, Kant, Nietzsche, and contemporary thinkers. Philosophy influences law, politics, and technology ethics.",
    metadata: { topic: "philosophy", importance: "medium", category: "humanities" }
  },

  // === CURRENT AFFAIRS & TECHNOLOGY ===
  {
    id: "current-technology-trends",
    title: "Current Technology Trends 2024-2025",
    content: "Current technology trends include generative AI, augmented reality, autonomous vehicles, quantum computing, and sustainable technology. AI tools like ChatGPT and Claude are transforming work. Web3 and metaverse concepts are evolving. Climate technology focuses on renewable energy and carbon capture. Biotechnology advances include gene therapy and personalized medicine.",
    metadata: { topic: "current-tech", importance: "high", category: "technology" }
  }
];

// EXPANDED KNOWLEDGE GRAPH
const knowledgeGraph: Record<string, Array<{target: string, predicate: string, weight: number}>> = {
  // Original GHChain relationships
  "GH GOLD": [
    { target: "GHChain", predicate: "isTokenOf", weight: 1.0 },
    { target: "Staking", predicate: "enables", weight: 0.9 },
    { target: "DeFi", predicate: "powersApplications", weight: 0.7 }
  ],
  "GOLDVAULT": [
    { target: "GH GOLD", predicate: "lists", weight: 0.9 },
    { target: "Africa", predicate: "servesRegion", weight: 0.8 }
  ],
  
  // AI & Technology relationships
  "AI": [
    { target: "Machine Learning", predicate: "includes", weight: 0.9 },
    { target: "Neural Networks", predicate: "uses", weight: 0.8 },
    { target: "Programming", predicate: "requires", weight: 0.7 }
  ],
  "Machine Learning": [
    { target: "Data", predicate: "learns_from", weight: 0.9 },
    { target: "Patterns", predicate: "recognizes", weight: 0.8 },
    { target: "Predictions", predicate: "makes", weight: 0.7 }
  ],
  "Blockchain": [
    { target: "Cryptocurrency", predicate: "enables", weight: 0.9 },
    { target: "Decentralization", predicate: "provides", weight: 0.8 },
    { target: "Smart Contracts", predicate: "supports", weight: 0.7 }
  ],
  "Programming": [
    { target: "Algorithms", predicate: "implements", weight: 0.8 },
    { target: "Software", predicate: "creates", weight: 0.9 },
    { target: "Web Development", predicate: "enables", weight: 0.7 }
  ],
  "Mathematics": [
    { target: "Physics", predicate: "underlies", weight: 0.8 },
    { target: "Computer Science", predicate: "enables", weight: 0.9 },
    { target: "Economics", predicate: "models", weight: 0.6 }
  ],
  "Business": [
    { target: "Economics", predicate: "applies", weight: 0.8 },
    { target: "Technology", predicate: "leverages", weight: 0.7 },
    { target: "Innovation", predicate: "drives", weight: 0.6 }
  ]
};

// Enhanced Reasoning Engine with broader knowledge
class ReasoningEngine {
  private embeddings: Map<string, number[]> = new Map();

  constructor() {
    // Pre-compute embeddings for all documents
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
      
      if (similarity > 0.05) { // Lower threshold for broader matching
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
    const knownEntities = [
      // Original entities
      'GHChain', 'GH GOLD', 'GOLDVAULT', 'Anaase', 'DeFi', 'Africa',
      // Tech entities
      'AI', 'Machine Learning', 'Neural Networks', 'Programming', 'Blockchain', 
      'Bitcoin', 'Cryptocurrency', 'Web Development', 'Cloud Computing',
      // Science entities  
      'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Quantum',
      // Business entities
      'Business', 'Economics', 'Finance', 'Markets', 'Innovation'
    ];
    
    const found: string[] = [];

    for (const entity of knownEntities) {
      if (text.toLowerCase().includes(entity.toLowerCase())) {
        found.push(entity);
      }
    }

    // Also extract capitalized words
    const capitalizedWords = text.match(/\b[A-Z][A-Za-z]{2,}\b/g) || [];
    found.push(...capitalizedWords.filter(word => word.length > 3));

    return Array.from(new Set(found));
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
      { name: 'ai-technology-rule', pattern: /ai|artificial intelligence|machine learning|neural network/i },
      { name: 'blockchain-crypto-rule', pattern: /blockchain|bitcoin|cryptocurrency|defi/i },
      { name: 'programming-rule', pattern: /programming|code|software|development/i },
      { name: 'science-rule', pattern: /physics|chemistry|biology|mathematics|quantum/i },
      { name: 'business-rule', pattern: /business|economics|finance|market/i },
      { name: 'token-ecosystem-rule', pattern: /token.*ecosystem|ecosystem.*token/i },
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
      return `I'm analyzing your query about "${query}" through the Anaase reasoning engine. While I have comprehensive knowledge across technology, science, business, and other domains, I may need more specific context to provide the most relevant answer.`;
    }

    let answer = "";

    if (docs.length > 0) {
      const topDoc = docs[0];
      const context = topDoc.preview.replace(/\.\.\.$/, '');
      answer += `Based on my knowledge base analysis: ${context}`;
    }

    if (graphPath.length > 0) {
      const relationships = graphPath.slice(0, 2).map(triple => 
        `${triple.subject} ${triple.predicate.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/_/g, ' ')} ${triple.object}`
      );
      
      if (answer) answer += " ";
      answer += `My reasoning engine also found these relationships: ${relationships.join('; ')}.`;
    }

    return answer || "I've processed your query using semantic search and knowledge graph traversal across my comprehensive knowledge base.";
  }

  async query(question: string, options: Record<string, any> = {}): Promise<QueryResponse> {
    const topK = options.topK || 5;
    const maxDepth = options.maxDepth || 3;
    const trace: TraceItem[] = [];

    // Step 1: Semantic search across all knowledge
    trace.push({
      type: "retrieval",
      info: { question, method: "semantic_search", knowledgeBase: "comprehensive" }
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
        rulesApplied: rulesFired.length,
        knowledgeDomains: Array.from(new Set(docs.map(d => d.meta.category)))
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

// Initialize expanded reasoning engine
const reasoningEngine = new ReasoningEngine();

// API endpoint (same as before)
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
