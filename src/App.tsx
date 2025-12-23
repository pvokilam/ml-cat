import { useState, useEffect, useCallback } from 'react';
import { classify } from './services/categoryClassifier';
import { CategoryDisplay } from './components/CategoryDisplay';
import { CategoryResult, ItemEmbedding } from './types';

const DEBOUNCE_DELAY = 300; // ms

function App() {
  const [input, setInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [categoryResult, setCategoryResult] = useState<CategoryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [items, setItems] = useState<ItemEmbedding[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [performance, setPerformance] = useState<{
    totalTime?: number;
  }>({});

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load grocery items for fallback classification
  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await import('./data/groceryEmbeddings.json');
        const loadedItems = data.default as ItemEmbedding[];
        setItems(loadedItems);
      } catch (error) {
        console.error('Failed to load grocery items. Please run: npm run precompute', error);
        setItems([]);
      }
    };
    loadItems();
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
        await isModelLoaded();
        setIsModelLoading(false);
      } catch (error) {
        console.error('API server not available:', error);
        console.log('App will use prefix matching fallback');
        setIsModelLoading(false);
      }
    };
    checkApi();
  }, []);

  // Classify when debounced input changes
  useEffect(() => {
    if (!debouncedInput.trim() || isModelLoading) {
      setCategoryResult(null);
      setIsLoading(false);
      return;
    }

    const processInput = async () => {
      setIsLoading(true);
      const startTime = window.performance.now();

      try {
        const categoryResult = await classify(debouncedInput, items);

        const totalTime = window.performance.now() - startTime;

        setCategoryResult(categoryResult);

        // Track total request time
        setPerformance({
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

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <div className="app">
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      <header className="app-header">
        <h1>Grocery ML Prototype</h1>
        <p className="subtitle">
          Category classification using server-side ML embeddings
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
              </div>

              {performance.totalTime && (
                <div className="performance">
                  <div className="performance-item">
                    Response time: {performance.totalTime.toFixed(1)}ms
                  </div>
                </div>
              )}

              <CategoryDisplay result={categoryResult} isLoading={isLoading} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;

