/**
 * Check if the API server is available and model is loaded
 * @returns true if the server is available and model is loaded
 */
export async function isModelLoaded(): Promise<boolean> {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.modelLoaded === true;
  } catch (error) {
    return false;
  }
}

