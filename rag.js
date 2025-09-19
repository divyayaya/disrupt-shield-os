import { SupabaseService } from "./supabase";

export class RAGService {
  static async retrieveRelevantKnowledge(category, context) {
    try {
      // Use keyword-based search instead of vector similarity
      const contextWords = context.toLowerCase().split(" ");

      const { data: knowledge, error } = await SupabaseService.supabase
        .from("knowledge_base")
        .select("*")
        .eq("category", category);

      if (error) throw error;

      return knowledge
        .map((item) => ({
          title: item.title,
          content: item.content,
          metadata: item.metadata,
          relevanceScore: this.calculateKeywordRelevance(
            contextWords,
            item.keywords || []
          ),
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error("RAG retrieval error:", error);
      return [];
    }
  }

  static calculateKeywordRelevance(queryWords, keywords) {
    if (!keywords || keywords.length === 0) return 0;

    const matches = queryWords.filter((word) =>
      keywords.some((keyword) =>
        keyword.toLowerCase().includes(word.toLowerCase())
      )
    ).length;

    return matches / Math.max(queryWords.length, 1);
  }

  static async getMitigationStrategies(
    orderValue,
    delayDays,
    supplierReliability
  ) {
    const context = `order value ${orderValue} delay ${delayDays} days supplier reliability ${supplierReliability}`;
    return await this.retrieveRelevantKnowledge("mitigation", context);
  }

  static async getCustomerPreferences(customerTier) {
    return await this.retrieveRelevantKnowledge(
      "customer_preferences",
      customerTier
    );
  }

  static async getDisruptionPatterns(disruptionType) {
    return await this.retrieveRelevantKnowledge(
      "disruption_patterns",
      disruptionType
    );
  }
}
