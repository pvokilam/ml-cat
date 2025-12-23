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

  // Load grocery items for autocomplete (text matching only)
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
        // Get suggestions (client-side text matching) and classify (server-side) in parallel
        const [categoryResult, suggestions] = await Promise.all([
          classify(debouncedInput, items),
          Promise.resolve(getSuggestions(debouncedInput, items, 5)),
        ]);

        const totalTime = window.performance.now() - startTime;

        setCategoryResult(categoryResult);
        setSuggestions(suggestions);

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

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setInput(suggestion);
    setDebouncedInput(suggestion);
  }, []);

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
          Category classification and auto-complete using server-side ML
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
                      Response time: {performance.totalTime.toFixed(1)}ms
                    </div>
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

