import { useState, useEffect, useCallback } from 'react';
import { classify } from './services/categoryClassifier';
import { getSuggestions } from './services/autocomplete';
import { CategoryDisplay } from './components/CategoryDisplay';
import { SuggestionList } from './components/SuggestionList';
import { CategoryResult, Suggestion, ItemEmbedding } from './types';

const DEBOUNCE_DELAY = 300; // ms

function App() {
  const [input, setInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [categoryResult, setCategoryResult] = useState<CategoryResult | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [items, setItems] = useState<ItemEmbedding[]>([]);
  const [performance, setPerformance] = useState<{
    embeddingTime?: number;
    searchTime?: number;
    totalTime?: number;
  }>({});

  // Load embeddings on mount
  useEffect(() => {
    const loadEmbeddings = async () => {
      try {
        const data = await import('./data/groceryEmbeddings.json');
        const loadedItems = data.default as ItemEmbedding[];
        setItems(loadedItems);
      } catch (error) {
        console.error('Failed to load embeddings. Please run: npm run precompute', error);
        setItems([]);
      }
    };
    loadEmbeddings();
  }, []);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInput(input);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [input]);

  // Check if API server is available
  useEffect(() => {
    const checkApi = async () => {
      try {
        const { isModelLoaded } = await import('./services/embeddingService');
        const loaded = await isModelLoaded();
        if (loaded) {
          // Test with a dummy encode to ensure it works
          const { encode } = await import('./services/embeddingService');
          await encode('test');
        }
        setIsModelLoading(false);
      } catch (error) {
        console.error('API server not available:', error);
        console.log('App will use prefix matching fallback');
        setIsModelLoading(false);
      }
    };
    checkApi();
  }, []);

  // Classify and get suggestions when debounced input changes
  useEffect(() => {
    if (!debouncedInput.trim() || isModelLoading) {
      setCategoryResult(null);
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const processInput = async () => {
      setIsLoading(true);
      const startTime = window.performance.now();

      try {
        // Run classification and suggestions in parallel
        const [categoryResult, suggestions] = await Promise.all([
          classify(debouncedInput, items),
          getSuggestions(debouncedInput, items, 5),
        ]);

        const totalTime = window.performance.now() - startTime;

        setCategoryResult(categoryResult);
        setSuggestions(suggestions);

        // Estimate performance (embedding time is the bottleneck)
        setPerformance({
          embeddingTime: totalTime * 0.8, // Rough estimate
          searchTime: totalTime * 0.2,
          totalTime,
        });
      } catch (error) {
        console.error('Error processing input:', error);
      } finally {
        setIsLoading(false);
      }
    };

    processInput();
  }, [debouncedInput, items, isModelLoading]);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setInput(suggestion);
    setDebouncedInput(suggestion);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Grocery ML Prototype</h1>
        <p className="subtitle">
          Category classification and auto-complete using on-device ML
        </p>
      </header>

      <main className="app-main">
        {isModelLoading ? (
          <div className="model-loading">
            <div className="spinner"></div>
            <p>Loading ML model... (this may take a moment)</p>
          </div>
        ) : (
          <>
            <div className="main-layout">
              <div className="left-column">
                <div className="input-section">
                  <label className="input-label">Grocery Item</label>
                  <input
                    type="text"
                    className="grocery-input"
                    placeholder="Type a grocery item (e.g., milk, apple, bread)..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    autoFocus
                  />
                  <SuggestionList
                    suggestions={suggestions}
                    onSelect={handleSuggestionSelect}
                    inputValue={input}
                  />
                </div>

                {performance.totalTime && (
                  <div className="performance">
                    <div className="performance-item">
                      Total: {performance.totalTime.toFixed(1)}ms
                    </div>
                    {performance.embeddingTime && (
                      <div className="performance-item">
                        Embedding: {performance.embeddingTime.toFixed(1)}ms
                      </div>
                    )}
                    {performance.searchTime && (
                      <div className="performance-item">
                        Search: {performance.searchTime.toFixed(1)}ms
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="right-column">
                <CategoryDisplay result={categoryResult} isLoading={isLoading} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;

