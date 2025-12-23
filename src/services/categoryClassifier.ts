import { CategoryResult, Category, ItemEmbedding } from '../types';

// API endpoint for category classification
const API_URL = '/api/category';

/**
 * Classify a grocery item into a category using server-side API
 * @param text User input text
 * @param items Precomputed item embeddings (kept for fallback, but not used for classification)
 * @returns Classification result with category, confidence, and neighbors
 */
export async function classify(
  text: string,
  items: ItemEmbedding[]
): Promise<CategoryResult> {
  if (!text.trim()) {
    return {
      category: 'Other',
      confidence: 0,
      neighbors: [],
    };
  }

  try {
    // Call server-side classification endpoint
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API request failed: ${response.status}`);
    }

    const result = await response.json();
    return result as CategoryResult;
  } catch (error) {
    // Fallback: use prefix matching to find category if server is unavailable
    console.warn('Server classification failed, using fallback:', error);
    const prefixMatches = items.filter(item => 
      item.name.toLowerCase().startsWith(text.toLowerCase())
    );
    if (prefixMatches.length > 0) {
      // Use the category of the first prefix match
      const categoryCounts: Record<string, number> = {};
      for (const match of prefixMatches.slice(0, 5)) {
        categoryCounts[match.category] = (categoryCounts[match.category] || 0) + 1;
      }
      let maxCount = 0;
      let predictedCategory: Category = 'Other';
      for (const [category, count] of Object.entries(categoryCounts)) {
        if (count > maxCount) {
          maxCount = count;
          predictedCategory = category as Category;
        }
      }
      return {
        category: predictedCategory,
        confidence: 0.7, // Lower confidence for prefix-based classification
        neighbors: prefixMatches.slice(0, 5).map(item => ({
          item,
          similarity: 0.7,
        })),
      };
    }
    return {
      category: 'Other',
      confidence: 0,
      neighbors: [],
    };
  }
}

