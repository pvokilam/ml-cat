/**
 * Model configuration - shared between precomputation and real-time inference
 * IMPORTANT: Keep these values in sync across all files that use the model
 */

export const MODEL_CONFIG = {
  // Model identifier - must match in precomputeEmbeddings.ts and server/api.ts
  modelId: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
  
  // Pipeline options - must match in both places
  pipelineOptions: {
    pooling: 'mean' as const,
    normalize: false,
  },
  
  // Expected vector dimension
  vectorDimension: 384,
  
  // Number of neighbors for classification
  kNeighbors: 5,
  
  // Confidence threshold
  confidenceThreshold: 0.5,
} as const;

