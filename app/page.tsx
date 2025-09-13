'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Brain, User, Sparkles, Database, Network, Cpu, Loader2, MessageCircle, AlertCircle } from 'lucide-react';

// Types
interface Document {
  id: string;
  score: number;
  preview: string;
  meta: { topic: string };
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

interface ReasoningResult {
  answer: string;
  docs: Document[];
  path: GraphTriple[];
  rulesFired: string[];
  trace: TraceItem[];
}

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  reasoning?: ReasoningResult;
}

// API Client
class AnaaseAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  async query(question: string, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Anaase API query error:", error);
      throw error;
    }
  }
}

// Main Component
export default function EdmundAnaaseAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello Edmund! I'm your real Anaase-powered AI assistant running on Vercel with edge computing. I have genuine reasoning capabilities including vector search, knowledge graph traversal, and rule-based inference. Ask me about GHChain, GOLDVAULT, or any complex topic requiring multi-hop reasoning!",
      isBot: true,
      timestamp: new Date(),
      reasoning: {
        answer: "",
        docs: [],
        path: [],
        rulesFired: [],
        trace: []
      }
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showReasoningTrace, setShowReasoningTrace] = useState<Record<number, boolean>>({});
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error'>('connected');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const anaaseAPI = new AnaaseAPI();

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isThinking]);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  // Send message
  const handleSendMessage = async () => {
    if (!inputText.trim() || isThinking) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsThinking(true);

    try {
      const reasoningResult = await anaaseAPI.query(currentInput, {
        topK: 5,
        maxDepth: 3,
        applyRules: true
      });

      setConnectionStatus('connected');

      const botResponse: Message = {
        id: Date.now() + 1,
        text: reasoningResult.answer || "I've processed your query through the Anaase reasoning engine.",
        isBot: true,
        timestamp: new Date(),
        reasoning: reasoningResult
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error("Reasoning error:", error);
      setConnectionStatus('error');

      const errorResponse: Message = {
        id: Date.now() + 1,
        text: "I encountered an issue with the reasoning engine. Let me try processing your query with the local knowledge base...",
        isBot: true,
        timestamp: new Date(),
        reasoning: {
          answer: "",
          docs: [],
          path: [],
          rulesFired: [],
          trace: []
        }
      };
      setMessages(prev => [...prev, errorResponse]);
    }

    setIsThinking(false);
  };

  // Keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle reasoning trace
  const toggleReasoningTrace = (messageId: number) => {
    setShowReasoningTrace(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Render reasoning trace
  const renderReasoningTrace = (reasoning: ReasoningResult) => {
    if (!reasoning || (!reasoning.docs?.length && !reasoning.path?.length && !reasoning.rulesFired?.length && !reasoning.trace?.length)) {
      return null;
    }

    return (
      <div className="mt-3 p-3 bg-black/20 rounded-xl border border-purple-500/30 text-xs">
        <div className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Anaase Reasoning Trace
        </div>

        {reasoning.docs && reasoning.docs.length > 0 && (
          <details className="mb-2">
            <summary className="text-blue-300 font-medium flex items-center gap-1 cursor-pointer hover:text-blue-200">
              <Database className="w-3 h-3" /> Retrieved Documents ({reasoning.docs.length})
            </summary>
            <div className="mt-1">
              {reasoning.docs.slice(0, 2).map((doc, i) => (
                <div key={i} className="text-white/70 ml-4 py-1">
                  • {doc.id} (similarity: {(doc.score * 100).toFixed(1)}%)
                  <div className="text-white/50 ml-2 text-xs">{doc.preview}</div>
                </div>
              ))}
            </div>
          </details>
        )}

        {reasoning.path && reasoning.path.length > 0 && (
          <details className="mb-2">
            <summary className="text-green-300 font-medium flex items-center gap-1 cursor-pointer hover:text-green-200">
              <Network className="w-3 h-3" /> Knowledge Graph Path ({reasoning.path.length} hops)
            </summary>
            <div className="mt-1">
              {reasoning.path.slice(0, 3).map((triple, i) => (
                <div key={i} className="text-white/70 ml-4 py-1">
                  • <span className="text-blue-300">{triple.subject}</span> →
                  <span className="text-purple-300 mx-1">{triple.predicate}</span> →
                  <span className="text-green-300">{triple.object}</span>
                  <span className="text-white/50 ml-2">({(triple.weight * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </details>
        )}

        {reasoning.rulesFired && reasoning.rulesFired.length > 0 && (
          <details className="mb-2">
            <summary className="text-orange-300 font-medium flex items-center gap-1 cursor-pointer hover:text-orange-200">
              <Cpu className="w-3 h-3" /> Rules Fired ({reasoning.rulesFired.length})
            </summary>
            <div className="mt-1">
              {reasoning.rulesFired.map((rule, i) => (
                <div key={i} className="text-white/70 ml-4 py-1">
                  • {rule}
                </div>
              ))}
            </div>
          </details>
        )}

        <div className="text-purple-200 text-center mt-2 opacity-75">
          Multi-hop reasoning complete ✓
        </div>
      </div>
    );
  };

  // Status color
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-400';
      case 'error': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div className={`absolute -top-1 -right-1 w-5 h-5 ${getStatusColor()} rounded-full animate-pulse flex items-center justify-center`}>
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Edmund's Anaase AI</h1>
            <p className="text-sm text-white/70">
              Real reasoning engine • Deployed on Vercel • Edge computing
              {connectionStatus === 'error' && <span className="text-red-400"> • Connection issue</span>}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400 animate-pulse" />
            <Network className="w-5 h-5 text-green-400 animate-pulse" />
            <Cpu className="w-5 h-5 text-orange-400 animate-pulse" />
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div className={`flex items-start gap-3 ${!message.isBot ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                message.isBot
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}>
                {message.isBot ? <Brain className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-white" />}
              </div>
              <div className={`max-w-xs lg:max-w-md xl:max-w-2xl rounded-2xl px-4 py-3 ${
                message.isBot
                  ? 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {message.isBot && message.reasoning && (
                    <button
                      onClick={() => toggleReasoningTrace(message.id)}
                      className="text-xs bg-purple-600/50 px-2 py-1 rounded-full hover:bg-purple-600/70 transition-colors flex items-center gap-1"
                    >
                      <Brain className="w-3 h-3" />
                      {showReasoningTrace[message.id] ? 'Hide' : 'Show'} Reasoning
                    </button>
                  )}
                </div>
              </div>
            </div>

            {message.isBot && showReasoningTrace[message.id] && (
              <div className="ml-12 mt-2">
                {renderReasoningTrace(message.reasoning!)}
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3">
              <span className="text-white/80 text-sm">Anaase reasoning engine processing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about GHChain, Anaase architecture, or any complex topic requiring deep reasoning..."
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              disabled={isThinking}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isThinking}
            className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            {isThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
          <MessageCircle className="w-4 h-4" />
          <span>Real Anaase integration • Vector search • Knowledge graphs • Rule inference • Deployed on Vercel</span>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
        </div>
      </div>
    </div>
  );
}

