import { encode } from './embeddingService';
import { findNearest } from './nearestNeighbor';
import { ItemEmbedding, CategoryResult, Category } from '../types';
import { MODEL_CONFIG } from '../config/modelConfig';

const CONFIDENCE_THRESHOLD = MODEL_CONFIG.confidenceThreshold;
const K_NEIGHBORS = MODEL_CONFIG.kNeighbors;

/**
 * Classify a grocery item into a category using nearest neighbor majority vote
 * @param text User input text
 * @param items Precomputed item embeddings
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

  // Generate embedding for input text
  let queryVector: number[];
  try {
    queryVector = await encode(text);
  } catch (error) {
    // Fallback: use prefix matching to find category
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

  // Find nearest neighbors
  const neighbors = findNearest(queryVector, items, K_NEIGHBORS);

  if (neighbors.length === 0) {
    return {
      category: 'Other',
      confidence: 0,
      neighbors: [],
    };
  }

  // Calculate average similarity (confidence)
  const avgSimilarity =
    neighbors.reduce((sum, n) => sum + n.similarity, 0) / neighbors.length;

  // If confidence is too low, return Other
  if (avgSimilarity < CONFIDENCE_THRESHOLD) {
    return {
      category: 'Other',
      confidence: avgSimilarity,
      neighbors,
    };
  }

  // Majority vote: count categories from neighbors
  const categoryCounts: Record<string, number> = {};
  for (const neighbor of neighbors) {
    const cat = neighbor.item.category;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  // Find category with most votes
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
    confidence: avgSimilarity,
    neighbors,
  };
}

