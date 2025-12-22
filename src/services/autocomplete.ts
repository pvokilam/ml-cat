import { encode } from './embeddingService';
import { findNearest } from './nearestNeighbor';
import { ItemEmbedding, Suggestion } from '../types';

const PREFIX_THRESHOLD = 3; // Use prefix search for inputs shorter than this

/**
 * Check if text starts with prefix (case-insensitive)
 */
function startsWith(text: string, prefix: string): boolean {
  return text.toLowerCase().startsWith(prefix.toLowerCase());
}

/**
 * Get auto-complete suggestions for user input
 * @param text User input text (can be partial)
 * @param items Precomputed item embeddings
 * @param limit Maximum number of suggestions to return
 * @returns Array of suggestions sorted by relevance
 */
export async function getSuggestions(
  text: string,
  items: ItemEmbedding[],
  limit: number = 5
): Promise<Suggestion[]> {
  if (!text.trim()) {
    return [];
  }

  const trimmedText = text.trim();

  // For short inputs, use prefix search
  if (trimmedText.length < PREFIX_THRESHOLD) {
    const prefixMatches = items
      .filter(item => startsWith(item.name, trimmedText))
      .slice(0, limit)
      .map(item => ({
        name: item.name,
        category: item.category,
        similarity: 1.0, // Perfect match for prefix
        isPrefixMatch: true,
      }));

    return prefixMatches;
  }

  // For longer inputs, use embedding similarity
  let queryVector: number[];
  try {
    queryVector = await encode(trimmedText);
  } catch (error) {
    // Fallback: use prefix search when model fails
    const prefixMatches = items
      .filter(item => startsWith(item.name, trimmedText))
      .slice(0, limit)
      .map(item => ({
        name: item.name,
        category: item.category,
        similarity: 0.9, // High similarity for prefix matches
        isPrefixMatch: true,
      }));
    return prefixMatches;
  }
  const neighbors = findNearest(queryVector, items, limit * 2); // Get more candidates

  // Boost items that match the prefix
  const suggestions: Suggestion[] = neighbors.map(neighbor => {
    const isPrefixMatch = startsWith(neighbor.item.name, trimmedText);
    return {
      name: neighbor.item.name,
      category: neighbor.item.category,
      similarity: isPrefixMatch
        ? Math.min(1.0, neighbor.similarity + 0.1) // Boost prefix matches
        : neighbor.similarity,
      isPrefixMatch,
    };
  });

  // Sort by similarity (with prefix boost) and take top N
  suggestions.sort((a, b) => b.similarity - a.similarity);
  return suggestions.slice(0, limit);
}

