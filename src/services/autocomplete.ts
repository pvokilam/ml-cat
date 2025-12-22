import { ItemEmbedding, Suggestion } from '../types';

/**
 * Check if text starts with prefix (case-insensitive)
 */
function startsWith(text: string, prefix: string): boolean {
  return text.toLowerCase().startsWith(prefix.toLowerCase());
}

/**
 * Check if text contains the search term (case-insensitive)
 */
function contains(text: string, search: string): boolean {
  return text.toLowerCase().includes(search.toLowerCase());
}

/**
 * Get auto-complete suggestions for user input
 * Uses text-based matching (prefix and contains) - embeddings don't make sense for autocomplete
 * Embeddings are better suited for classification after the user finishes typing
 * 
 * @param text User input text (can be partial)
 * @param items Precomputed item embeddings
 * @param limit Maximum number of suggestions to return
 * @returns Array of suggestions sorted by relevance
 */
export function getSuggestions(
  text: string,
  items: ItemEmbedding[],
  limit: number = 5
): Suggestion[] {
  if (!text.trim()) {
    return [];
  }

  const trimmedText = text.trim().toLowerCase();

  // Always use prefix search for autocomplete - it's what users expect
  // Find exact prefix matches first
  const prefixMatches = items
    .filter(item => startsWith(item.name, trimmedText))
    .slice(0, limit)
    .map(item => ({
      name: item.name,
      category: item.category,
      similarity: 1.0, // Perfect match for prefix
    }));

  // If we have enough prefix matches, return them
  if (prefixMatches.length >= limit) {
    return prefixMatches;
  }

  // If we don't have enough prefix matches, supplement with contains matches
  // (items that contain the search term but don't start with it)
  const remainingSlots = limit - prefixMatches.length;
  const containsMatches = items
    .filter(item => {
      const lowerName = item.name.toLowerCase();
      return contains(lowerName, trimmedText) && !startsWith(lowerName, trimmedText);
    })
    .slice(0, remainingSlots)
    .map(item => ({
      name: item.name,
      category: item.category,
      similarity: 0.8, // High similarity for contains matches
    }));

  return [...prefixMatches, ...containsMatches];
}

