// app/api/chat/route.ts - Enhanced Conversational AI
import { NextRequest, NextResponse } from 'next/server';

interface ConversationContext {
  userId: string;
  sessionId: string;
  conversationHistory: Message[];
  userPreferences: UserProfile;
  currentTopic: string;
  conversationFlow: ConversationState;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  context: {
    entities: string[];
    intent: string;
    sentiment: number;
    topicShift: boolean;
  };
}

interface UserProfile {
  learningLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  interests: string[];
  communicationStyle: 'formal' | 'casual' | 'academic' | 'creative';
  preferredExplanationDepth: number;
  culturalContext: string;
  languagePreference: string;
}

interface ConversationState {
  phase: 'greeting' | 'exploring' | 'deep_dive' | 'clarifying' | 'concluding';
  confidence: number;
  needsClarification: boolean;
  suggestedFollowUps: string[];
}

// Enhanced Response Generator with Personality
class ConversationalAI {
  private conversationMemory: Map<string, ConversationContext> = new Map();
  
  // Personality traits
  private personality = {
    curiosity: 0.8,
    helpfulness: 0.9,
    patience: 0.9,
    creativity: 0.7,
    formality: 0.5,
    enthusiasm: 0.7
  };

  async generateResponse(
    userInput: string, 
    sessionId: string, 
    userId: string = 'anonymous'
  ): Promise<{
    response: string;
    context: ConversationContext;
    suggestedQuestions: string[];
    confidence: number;
  }> {
    // Get or create conversation context
    const contextKey = `${userId}-${sessionId}`;
    let context = this.conversationMemory.get(contextKey) || this.initializeContext(userId, sessionId);
    
    // Analyze user input
    const inputAnalysis = this.analyzeInput(userInput, context);
    
    // Update conversation context
    context = this.updateContext(context, userInput, inputAnalysis);
    
    // Generate contextual response
    const response = await this.generateContextualResponse(userInput, context, inputAnalysis);
    
    // Generate follow-up suggestions
    const suggestedQuestions = this.generateFollowUps(context, inputAnalysis);
    
    // Update memory
    this.conversationMemory.set(contextKey, context);
    
    return {
      response: response.content,
      context,
      suggestedQuestions,
      confidence: response.confidence
    };
  }

  private initializeContext(userId: string, sessionId: string): ConversationContext {
    return {
      userId,
      sessionId,
      conversationHistory: [],
      userPreferences: {
        learningLevel: 'intermediate',
        interests: [],
        communicationStyle: 'casual',
        preferredExplanationDepth: 5,
        culturalContext: 'global',
        languagePreference: 'english'
      },
      currentTopic: '',
      conversationFlow: {
        phase: 'greeting',
        confidence: 0.5,
        needsClarification: false,
        suggestedFollowUps: []
      }
    };
  }

  private analyzeInput(input: string, context: ConversationContext) {
    const words = input.toLowerCase().split(/\s+/);
    
    // Intent recognition
    const intents = {
      question: /\b(what|how|why|when|where|who|can|could|would|should)\b/i.test(input),
      explanation: /\b(explain|describe|tell me|help me understand)\b/i.test(input),
      comparison: /\b(compare|difference|versus|vs|better|worse)\b/i.test(input),
      creation: /\b(create|make|build|develop|design)\b/i.test(input),
      learning: /\b(learn|study|teach|understand|know)\b/i.test(input),
      casual: /\b(hi|hello|hey|thanks|cool|awesome)\b/i.test(input)
    };

    // Sentiment analysis (simple)
    const sentimentWords = {
      positive: ['good', 'great', 'awesome', 'excellent', 'love', 'like', 'amazing'],
      negative: ['bad', 'terrible', 'hate', 'dislike', 'awful', 'horrible'],
      neutral: ['okay', 'fine', 'normal', 'average']
    };

    let sentiment = 0;
    for (const word of words) {
      if (sentimentWords.positive.includes(word)) sentiment += 1;
      if (sentimentWords.negative.includes(word)) sentiment -= 1;
    }
    sentiment = Math.max(-1, Math.min(1, sentiment / words.length * 10));

    // Entity extraction (enhanced)
    const entities = this.extractEntities(input);
    
    // Topic detection
    const topics = this.detectTopics(input, context);
    
    return {
      intent: Object.entries(intents).find(([_, matches]) => matches)?.[0] || 'general',
      sentiment,
      entities,
      topics,
      complexity: this.assessComplexity(input),
      topicShift: this.detectTopicShift(topics, context.currentTopic)
    };
  }

  private extractEntities(text: string): string[] {
    const entities = new Set<string>();
    
    // Technical terms
    const techPatterns = [
      /\b(AI|ML|blockchain|cryptocurrency|programming|software|database|api|framework)\b/gi,
      /\b[A-Z][a-z]*(?:\s+[A-Z][a-z]*)*\b/g, // Proper nouns
      /\b\d+[a-zA-Z]+\b/g // Alphanumeric
    ];
    
    for (const pattern of techPatterns) {
      const matches = text.match(pattern) || [];
      matches.forEach(match => entities.add(match));
    }
    
    return Array.from(entities);
  }

  private detectTopics(input: string, context: ConversationContext): string[] {
    const topicKeywords = {
      'technology': ['ai', 'computer', 'software', 'programming', 'tech', 'digital'],
      'science': ['physics', 'chemistry', 'biology', 'research', 'experiment'],
      'education': ['learn', 'study', 'teach', 'school', 'university', 'student'],
      'business': ['market', 'company', 'startup', 'entrepreneur', 'business'],
      'blockchain': ['bitcoin', 'crypto', 'defi', 'ghchain', 'token'],
      'health': ['medicine', 'doctor', 'health', 'medical', 'treatment'],
      'philosophy': ['ethics', 'consciousness', 'meaning', 'philosophy', 'think']
    };
    
    const inputLower = input.toLowerCase();
    const topics: string[] = [];
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => inputLower.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    return topics.length > 0 ? topics : ['general'];
  }

  private assessComplexity(input: string): number {
    const factors = {
      length: Math.min(input.length / 100, 1),
      technicalTerms: (input.match(/\b[A-Z]{2,}|\w{8,}\b/g) || []).length / 10,
      questionDepth: (input.match(/\b(why|how|what if|explain|analyze)\b/gi) || []).length,
      multipleConcepts: (input.match(/\band\b|\bor\b|\bbut\b|\bhowever\b/gi) || []).length / 5
    };
    
    return Math.min(
      (factors.length + factors.technicalTerms + factors.questionDepth + factors.multipleConcepts) / 4,
      1
    );
  }

  private detectTopicShift(currentTopics: string[], previousTopic: string): boolean {
    return previousTopic !== '' && !currentTopics.includes(previousTopic);
  }

  private updateContext(
    context: ConversationContext, 
    userInput: string, 
    analysis: any
  ): ConversationContext {
    // Add to conversation history
    const userMessage: Message = {
      id: Date.now().toString(),
      content: userInput,
      role: 'user',
      timestamp: new Date(),
      context: {
        entities: analysis.entities,
        intent: analysis.intent,
        sentiment: analysis.sentiment,
        topicShift: analysis.topicShift
      }
    };
    
    context.conversationHistory.push(userMessage);
    
    // Update current topic
    if (analysis.topics.length > 0) {
      context.currentTopic = analysis.topics[0];
    }
    
    // Update conversation flow
    context.conversationFlow = this.updateConversationFlow(context, analysis);
    
    // Adapt user preferences based on interaction
    context.userPreferences = this.adaptUserPreferences(context.userPreferences, analysis);
    
    return context;
  }

  private updateConversationFlow(context: ConversationContext, analysis: any): ConversationState {
    const { phase } = context.conversationFlow;
    
    let newPhase = phase;
    
    // Phase transitions based on conversation patterns
    if (phase === 'greeting' && analysis.intent !== 'casual') {
      newPhase = 'exploring';
    } else if (phase === 'exploring' && analysis.complexity > 0.6) {
      newPhase = 'deep_dive';
    } else if (analysis.intent === 'question' && context.conversationHistory.length > 3) {
      newPhase = 'clarifying';
    }
    
    const confidence = this.calculateConfidence(context, analysis);
    const needsClarification = confidence < 0.6 || analysis.complexity > 0.8;
    
    return {
      phase: newPhase,
      confidence,
      needsClarification,
      suggestedFollowUps: []
    };
  }

  private calculateConfidence(context: ConversationContext, analysis: any): number {
    let confidence = 0.7; // Base confidence
    
    // Adjust based on factors
    if (analysis.entities.length > 0) confidence += 0.1;
    if (context.conversationHistory.length > 2) confidence += 0.1;
    if (analysis.topicShift) confidence -= 0.2;
    if (analysis.complexity > 0.8) confidence -= 0.1;
    
    return Math.max(0.1, Math.min(0.95, confidence));
  }

  private adaptUserPreferences(preferences: UserProfile, analysis: any): UserProfile {
    // Adapt communication style based on user language
    if (analysis.intent === 'casual' || analysis.sentiment > 0.5) {
      preferences.communicationStyle = 'casual';
    } else if (analysis.complexity > 0.7) {
      preferences.communicationStyle = 'academic';
    }
    
    // Update interests based on topics
    for (const topic of analysis.topics) {
      if (!preferences.interests.includes(topic)) {
        preferences.interests.push(topic);
      }
    }
    
    // Adjust explanation depth based on questions
    if (analysis.intent === 'explanation' && analysis.complexity > 0.6) {
      preferences.preferredExplanationDepth = Math.min(8, preferences.preferredExplanationDepth + 1);
    }
    
    return preferences;
  }

  private async generateContextualResponse(
    input: string,
    context: ConversationContext,
    analysis: any
  ): Promise<{ content: string; confidence: number }> {
    const { phase, confidence } = context.conversationFlow;
    const { communicationStyle, preferredExplanationDepth } = context.userPreferences;
    
    // Generate response based on phase and context
    let responseContent = '';
    
    switch (analysis.intent) {
      case 'question':
        responseContent = await this.generateQuestionResponse(input, context, analysis);
        break;
      case 'explanation':
        responseContent = await this.generateExplanationResponse(input, context, analysis);
        break;
      case 'comparison':
        responseContent = await this.generateComparisonResponse(input, context, analysis);
        break;
      case 'casual':
        responseContent = this.generateCasualResponse(input, context, analysis);
        break;
      default:
        responseContent = await this.generateGeneralResponse(input, context, analysis);
    }
    
    // Add personality touches
    responseContent = this.addPersonalityTouch(responseContent, context, analysis);
    
    // Add conversation flow elements
    if (phase === 'clarifying' || confidence < 0.6) {
      responseContent += this.addClarificationRequest(context);
    }
    
    return {
      content: responseContent,
      confidence
    };
  }

  private async generateQuestionResponse(
    input: string,
    context: ConversationContext,
    analysis: any
  ): Promise<string> {
    // This would integrate with your existing reasoning engine
    const reasoningResult = await this.queryKnowledgeBase(input, context);
    
    let response = reasoningResult.answer;
    
    // Add contextual depth based on user preferences
    const depth = context.userPreferences.preferredExplanationDepth;
    if (depth > 5 && reasoningResult.docs.length > 0) {
      response += `\n\nFor deeper understanding: ${reasoningResult.docs[0].preview}`;
    }
    
    // Add examples if technical topic
    if (analysis.topics.includes('technology') || analysis.topics.includes('science')) {
      response += this.addTechnicalExamples(input, analysis.entities);
    }
    
    return response;
  }

  private async generateExplanationResponse(
    input: string,
    context: ConversationContext,
    analysis: any
  ): Promise<string> {
    const concept = analysis.entities[0] || this.extractMainConcept(input);
    
    let explanation = `Let me explain ${concept} in a way that connects with what we've been discussing.\n\n`;
    
    // Build explanation based on user level and context
    const level = context.userPreferences.learningLevel;
    
    switch (level) {
      case 'beginner':
        explanation += this.generateBeginnerExplanation(concept, context);
        break;
      case 'intermediate':
        explanation += this.generateIntermediateExplanation(concept, context);
        break;
      case 'advanced':
        explanation += this.generateAdvancedExplanation(concept, context);
        break;
      case 'expert':
        explanation += this.generateExpertExplanation(concept, context);
        break;
    }
    
    return explanation;
  }

  private generateCasualResponse(input: string, context: ConversationContext, analysis: any): string {
    const casualResponses = {
      greeting: [
        "Hey there! Ready to dive into something interesting?",
        "Hello! What's on your mind today?",
        "Hi! I'm here and ready to explore whatever you're curious about."
      ],
      thanks: [
        "You're very welcome! Always happy to help.",
        "Glad I could help! What else would you like to explore?",
        "No problem at all! Feel free to ask me anything else."
      ],
      positive: [
        "That's awesome! Tell me more about what interests you.",
        "Great! I love your enthusiasm. What would you like to know?",
        "Fantastic! Let's keep this conversation going."
      ]
    };
    
    if (input.match(/\b(hi|hello|hey)\b/i)) {
      return this.randomChoice(casualResponses.greeting);
    } else if (input.match(/\b(thanks|thank you)\b/i)) {
      return this.randomChoice(casualResponses.thanks);
    } else if (analysis.sentiment > 0.3) {
      return this.randomChoice(casualResponses.positive);
    }
    
    return "I hear you! What would you like to talk about?";
  }

  private addPersonalityTouch(
    response: string,
    context: ConversationContext,
    analysis: any
  ): string {
    const { curiosity, enthusiasm, creativity } = this.personality;
    
    // Add curiosity
    if (Math.random() < curiosity && analysis.entities.length > 0) {
      const entity = analysis.entities[0];
      response += `\n\nI'm curious - what specifically about ${entity} interests you most?`;
    }
    
    // Add enthusiasm for learning topics
    if (Math.random() < enthusiasm && analysis.topics.includes('education')) {
      response = "I love helping with learning! " + response;
    }
    
    // Add creative connections
    if (Math.random() < creativity && context.conversationHistory.length > 2) {
      const previousTopic = context.currentTopic;
      if (previousTopic && analysis.topics[0] !== previousTopic) {
        response += `\n\nInteresting how this connects to what we discussed about ${previousTopic} earlier!`;
      }
    }
    
    return response;
  }

  private addClarificationRequest(context: ConversationContext): string {
    const clarifications = [
      "\n\nWould you like me to explain any part of this in more detail?",
      "\n\nIs there a specific aspect you'd like me to focus on?",
      "\n\nShould I dive deeper into any particular area?",
      "\n\nWhat would be most helpful for you to understand better?"
    ];
    
    return this.randomChoice(clarifications);
  }

  private generateFollowUps(context: ConversationContext, analysis: any): string[] {
    const followUps: string[] = [];
    
    // Based on current topic
    if (analysis.topics.includes('technology')) {
      followUps.push(
        "How is this technology being used today?",
        "What are the future implications?",
        "What challenges does this technology face?"
      );
    }
    
    // Based on entities mentioned
    for (const entity of analysis.entities.slice(0, 2)) {
      followUps.push(
        `Tell me more about ${entity}`,
        `How does ${entity} work?`,
        `What's the significance of ${entity}?`
      );
    }
    
    // Based on conversation history
    if (context.conversationHistory.length > 3) {
      followUps.push(
        "Can you give me a practical example?",
        "How does this relate to real-world applications?",
        "What should I know next about this topic?"
      );
    }
    
    return followUps.slice(0, 4);
  }

  // Placeholder methods that would integrate with your existing reasoning engine
  private async queryKnowledgeBase(query: string, context: ConversationContext) {
    // This would call your existing UltimateDeepSearchEngine
    return {
      answer: "This would be generated by your existing reasoning engine, enhanced with conversational context.",
      docs: [],
      confidence: 0.8
    };
  }

  private extractMainConcept(input: string): string {
    // Extract the main concept from explanation requests
    const matches = input.match(/explain\s+(\w+(?:\s+\w+)*)/i);
    return matches?.[1] || 'this concept';
  }

  private generateBeginnerExplanation(concept: string, context: ConversationContext): string {
    return `${concept} is like... (simplified explanation with analogies)`;
  }

  private generateIntermediateExplanation(concept: string, context: ConversationContext): string {
    return `${concept} works by... (balanced technical and accessible explanation)`;
  }

  private generateAdvancedExplanation(concept: string, context: ConversationContext): string {
    return `${concept} involves... (technical explanation with nuances)`;
  }

  private generateExpertExplanation(concept: string, context: ConversationContext): string {
    return `${concept} can be understood through... (expert-level technical details)`;
  }

  private addTechnicalExamples(input: string, entities: string[]): string {
    return `\n\nFor example, if you're working with ${entities[0] || 'this concept'}...`;
  }

  private async generateGeneralResponse(
    input: string,
    context: ConversationContext,
    analysis: any
  ): Promise<string> {
    return "I understand what you're asking about. Let me help you with that...";
  }

  private async generateComparisonResponse(
    input: string,
    context: ConversationContext,
    analysis: any
  ): Promise<string> {
    return "Let me compare these concepts for you...";
  }

  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}

// API endpoint
const conversationalAI = new ConversationalAI();

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, userId, preferences } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await conversationalAI.generateResponse(
      message,
      sessionId || 'default',
      userId || 'anonymous'
    );

    return NextResponse.json({
      response: result.response,
      confidence: result.confidence,
      suggestedQuestions: result.suggestedQuestions,
      conversationContext: {
        phase: result.context.conversationFlow.phase,
        topic: result.context.currentTopic,
        userLevel: result.context.userPreferences.learningLevel
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: "conversational-ai-v1.0"
      }
    });

  } catch (error) {
    console.error('Conversational AI error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
