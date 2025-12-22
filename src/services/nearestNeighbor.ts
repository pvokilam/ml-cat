import { ItemEmbedding, Neighbor } from '../types';

/**
 * Calculate cosine similarity between two normalized vectors using dot product
 * @param vec1 First normalized vector
 * @param vec2 Second normalized vector
 * @returns Cosine similarity score (0-1, where 1 is most similar)
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
  }

  return dotProduct; // Since vectors are normalized, dot product = cosine similarity
}

/**
 * Find the k nearest neighbors to a query vector
 * @param query Normalized query vector
 * @param items Array of item embeddings to search
 * @param k Number of neighbors to return
 * @returns Array of neighbors sorted by similarity (highest first)
 */
export function findNearest(
  query: number[],
  items: ItemEmbedding[],
  k: number
): Neighbor[] {
  const similarities: Neighbor[] = [];

  for (const item of items) {
    const similarity = cosineSimilarity(query, item.vector);
    similarities.push({
      item,
      similarity,
    });
  }

  // Sort by similarity (descending) and take top k
  similarities.sort((a, b) => b.similarity - a.similarity);
  return similarities.slice(0, k);
}

