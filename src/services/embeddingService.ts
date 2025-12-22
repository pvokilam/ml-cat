// Use local API server instead of loading model in browser
// This avoids CORS issues since the API runs on the same dev server

// API endpoint for embedding generation
const API_URL = '/api/embed';

/**
 * Check if the API server is available
 */
async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    return data.modelLoaded === true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a normalized embedding vector for the given text
 * Uses the local API server to avoid CORS issues
 * @param text Input text to encode
 * @returns Normalized embedding vector (384 dimensions)
 */
export async function encode(text: string): Promise<number[]> {
  try {
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

    const data = await response.json();
    return data.vector as number[];
  } catch (error) {
    // If API is not available, throw error (will be caught by fallback in classifier/autocomplete)
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if the API server is available and model is loaded
 */
export async function isModelLoaded(): Promise<boolean> {
  return await checkApiHealth();
}

