import express from 'express';
import cors from 'cors';
import { pipeline } from '@xenova/transformers';
import { MODEL_CONFIG } from '../src/config/modelConfig.js';

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

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`Model loading in background...`);
});

