import express from 'express';
import cors from 'cors';
import { pipeline } from '@xenova/transformers';
import { readFileSync } from 'fs';
import { join } from 'path';
import { MODEL_CONFIG } from '../src/config/modelConfig.js';
import type { ItemEmbedding, Category, CategoryResult, Neighbor } from '../src/types/index.js';

const app = express();
const PORT = 3001;

// Enable CORS for Vite dev server
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// L2 normalization function
function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map(val => val / magnitude);
}

// Load model once on startup
let extractor: any = null;
let modelLoading = false;
let modelLoadPromise: Promise<any> | null = null;

async function loadModel() {
  if (extractor) {
    return extractor;
  }

  if (modelLoadPromise) {
    return modelLoadPromise;
  }

  console.log('Loading embedding model...');
  console.log(`Model: ${MODEL_CONFIG.modelId}`);
  modelLoadPromise = pipeline(
    'feature-extraction',
    MODEL_CONFIG.modelId
  ).then(model => {
    extractor = model;
    console.log('Model loaded successfully');
    return model;
  }).catch(error => {
    console.error('Failed to load model:', error);
    modelLoadPromise = null;
    throw error;
  });

  return modelLoadPromise;
}

// Initialize model on server start
loadModel().catch(console.error);

// Load grocery embeddings
let groceryEmbeddings: ItemEmbedding[] = [];
let embeddingsLoaded = false;

function loadEmbeddings() {
  if (embeddingsLoaded) {
    return groceryEmbeddings;
  }

  try {
    const embeddingsPath = join(process.cwd(), 'src/data/groceryEmbeddings.json');
    const data = JSON.parse(readFileSync(embeddingsPath, 'utf-8'));
    groceryEmbeddings = Array.isArray(data) ? data : data.default || [];
    embeddingsLoaded = true;
    console.log(`Loaded ${groceryEmbeddings.length} grocery embeddings`);
    return groceryEmbeddings;
  } catch (error) {
    console.error('Failed to load grocery embeddings:', error);
    return [];
  }
}

// Cosine similarity function
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

// Find nearest neighbors
function findNearest(query: number[], items: ItemEmbedding[], k: number): Neighbor[] {
  const similarities: Neighbor[] = [];
  for (const item of items) {
    const similarity = cosineSimilarity(query, item.vector);
    similarities.push({ item, similarity });
  }
  similarities.sort((a, b) => b.similarity - a.similarity);
  return similarities.slice(0, k);
}

// Classify text into a category
async function classifyText(text: string): Promise<CategoryResult> {
  const items = loadEmbeddings();
  
  if (items.length === 0) {
    return {
      category: 'Other',
      confidence: 0,
      neighbors: [],
    };
  }

  // Generate embedding for input text
  const model = await loadModel();
  const output = await model(text, MODEL_CONFIG.pipelineOptions);
  const vector = Array.from(output.data) as number[];
  const queryVector = normalize(vector);

  // Find nearest neighbors
  const neighbors = findNearest(queryVector, items, MODEL_CONFIG.kNeighbors);

  if (neighbors.length === 0) {
    return {
      category: 'Other',
      confidence: 0,
      neighbors: [],
    };
  }

  const confidence = neighbors[0].similarity;

  // If confidence is too low, return Other
  if (confidence < MODEL_CONFIG.confidenceThreshold) {
    return {
      category: 'Other',
      confidence,
      neighbors,
    };
  }

  // Weighted voting: each neighbor's vote is weighted by similarity
  const categoryCounts: Record<string, number> = {};
  for (const neighbor of neighbors) {
    const cat = neighbor.item.category;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + neighbor.similarity;
  }

  // Find category with highest weighted vote
  let maxWeight = 0;
  let predictedCategory: Category = 'Other';
  for (const [category, weight] of Object.entries(categoryCounts)) {
    if (weight > maxWeight) {
      maxWeight = weight;
      predictedCategory = category as Category;
    }
  }

  return {
    category: predictedCategory,
    confidence,
    neighbors,
  };
}

// API endpoint to generate embeddings
app.post('/api/embed', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Ensure model is loaded
    const model = await loadModel();

    // Generate embedding
    const output = await model(text, MODEL_CONFIG.pipelineOptions);
    const vector = Array.from(output.data) as number[];
    
    // Normalize the vector
    const normalizedVector = normalize(vector);

    res.json({
      vector: normalizedVector,
      dimension: normalizedVector.length,
    });
  } catch (error) {
    console.error('Error generating embedding:', error);
    res.status(500).json({
      error: 'Failed to generate embedding',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    modelLoaded: extractor !== null,
  });
});

// Category classification endpoint
app.post('/api/category', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await classifyText(text);
    res.json(result);
  } catch (error) {
    console.error('Error classifying text:', error);
    res.status(500).json({
      error: 'Failed to classify text',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`Model loading in background...`);
});

