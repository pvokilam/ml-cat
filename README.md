# Grocery ML Prototype

A React desktop prototype for testing grocery item categorization and auto-complete using lightweight on-device ML models suitable for iOS.

## Features

- **Category Classification**: Automatically assigns grocery items to categories (Produce, Dairy, Bakery, etc.)
- **Auto-complete**: Provides real-time suggestions as you type
- **On-device ML**: Uses Transformers.js to run multilingual MiniLM-L12-v2 model in the browser
- **Offline**: Works completely offline after initial model load
- **Performance**: Targets <10ms embedding generation, <2ms search

## Setup

1. Install dependencies:
```bash
npm install
```

2. Precompute embeddings for grocery items:
```bash
npm run precompute
```

This will:
- Load the multilingual MiniLM-L12-v2 model
- Generate embeddings for all grocery items
- Normalize and save embeddings to `src/data/groceryEmbeddings.json`

**Note**: The first run will download the model (~20MB), which may take a few minutes.

3. Start the development servers:
```bash
# Option 1: Run both servers together (recommended)
npm run dev:all

# Option 2: Run them separately in different terminals
# Terminal 1: API server (runs on port 3001)
npm run dev:api

# Terminal 2: Vite dev server (runs on port 5173)
npm run dev
```

4. Open the app in your browser (usually `http://localhost:5173`)

**Note:** The API server runs on `localhost:3001` and loads the ML model server-side (avoiding CORS issues). The Vite dev server proxies API requests to it automatically.

## Usage

1. Type a grocery item in the input field (e.g., "milk", "apple", "bread")
2. The app will:
   - Show auto-complete suggestions as you type
   - Classify the item into a category
   - Display confidence score and similar items
   - Show performance metrics

## Architecture

- **Embedding Model**: `Xenova/paraphrase-multilingual-MiniLM-L12-v2` (384-dim vectors)
- **API Server**: Local Express server (port 3001) that loads the model server-side to avoid CORS issues
- **Similarity**: Cosine similarity using dot product on normalized vectors
- **Classification**: K-nearest neighbors (K=5) with majority vote
- **Auto-complete**: Prefix search for short inputs (<3 chars), embedding similarity for longer inputs

## Project Structure

```
ml-cat/
├── src/
│   ├── components/       # React UI components
│   ├── services/         # ML services (embedding, classification, autocomplete)
│   ├── types/            # TypeScript type definitions
│   ├── data/             # Grocery items and precomputed embeddings
│   └── App.tsx           # Main application component
├── server/
│   └── api.ts            # Express API server for embedding generation
├── scripts/
│   └── precomputeEmbeddings.ts  # Script to generate embeddings
└── requirements.md       # Original requirements document
```

## Testing

Try these test cases:
- **Known items**: "milk", "apple", "bread"
- **Typos**: "milkk", "appel", "bred"
- **Partial input**: "mil", "app", "bre"
- **Unknown items**: "quinoa salad", "protein shake"

## Performance Targets

- Embedding generation: <10ms
- Nearest neighbor search: <2ms
- Total latency: ~10-12ms

Performance metrics are displayed in the UI after each classification.

