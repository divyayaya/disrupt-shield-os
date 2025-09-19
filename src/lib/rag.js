import { SupabaseService } from './supabase.js';

export class RAGSystem {
  constructor() {
    this.knowledgeBase = null;
  }

  async initialize() {
    console.log('Initializing RAG system...');
    try {
      this.knowledgeBase = await this.loadKnowledgeBase();
      console.log(`RAG system initialized with ${this.knowledgeBase.length} knowledge entries`);
    } catch (error) {
      console.error('Failed to initialize RAG system:', error);
      throw error;
    }
  }

  async loadKnowledgeBase() {
    const { data, error } = await SupabaseService.supabase
      .from('knowledge_base')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load knowledge base: ${error.message}`);
    }

    return data || [];
  }

  async retrieveRelevantKnowledge(query, category = null, limit = 5) {
    console.log(`Retrieving knowledge for query: "${query}"`);
    
    try {
      const relevantKnowledge = await this.semanticSearch(query, category, limit);
      
      return relevantKnowledge.map(item => ({
        title: item.title,
        content: item.content,
        category: item.category,
        relevanceScore: item.relevanceScore || 0.8,
        metadata: item.metadata || {}
      }));
      
    } catch (error) {
      console.error('Knowledge retrieval failed:', error);
      return [];
    }
  }

  async semanticSearch(query, category = null, limit = 5) {
    console.log('Performing semantic search...');
    
    try {
      let queryBuilder = SupabaseService.supabase
        .from('knowledge_base')
        .select('*');

      if (category) {
        queryBuilder = queryBuilder.eq('category', category);
      }

      queryBuilder = queryBuilder.textSearch('content', query);

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        relevanceScore: this.calculateRelevanceScore(query, item.content)
      }));
      
    } catch (error) {
      console.error('Semantic search failed:', error);
      return [];
    }
  }

  calculateRelevanceScore(query, content) {
    const queryWords = query.toLowerCase().split(' ');
    const contentWords = content.toLowerCase().split(' ');
    
    let matches = 0;
    queryWords.forEach(word => {
      if (contentWords.includes(word)) {
        matches++;
      }
    });
    
    return matches / queryWords.length;
  }
}

export const ragSystem = new RAGSystem();