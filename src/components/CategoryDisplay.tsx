import { CategoryResult } from '../types';
import { categoryEmojis, formatCategoryName } from '../config/categoryEmojis';

interface CategoryDisplayProps {
  result: CategoryResult | null;
  isLoading: boolean;
}

const categoryColors: Record<string, string> = {
  Produce: '#2e7d32',      // Darker green for better contrast
  Dairy: '#1565c0',        // Darker blue
  Bakery: '#e65100',       // Darker orange
  'Meat & Seafood': '#c62828', // Darker red
  Pantry: '#6a1b9a',      // Darker purple
  Frozen: '#00838f',       // Darker cyan
  Snacks: '#f57c00',       // Darker orange-yellow (was too light)
  Beverages: '#0277bd',    // Darker blue
  Household: '#5d4037',    // Darker brown
  'Personal Care': '#c2185b', // Darker pink
  'Pet Supplies': '#455a64',  // Darker blue-gray
  Other: '#616161',        // Darker gray
};

export function CategoryDisplay({ result, isLoading }: CategoryDisplayProps) {
  if (isLoading) {
    return (
      <div className="category-display">
        <div className="category-loading">Classifying...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="category-display">
        <div className="category-placeholder">Type a grocery item to classify</div>
      </div>
    );
  }

  const color = categoryColors[result.category] || categoryColors.Other;
  const emoji = categoryEmojis[result.category] || categoryEmojis.Other;
  const confidencePercent = Math.round(result.confidence * 100);

  return (
    <div className="category-display">
      <div
        className="category-badge"
        style={{ backgroundColor: color }}
      >
        {emoji} {formatCategoryName(result.category)}
      </div>
      <div className="confidence">
        Confidence: {confidencePercent}%
      </div>
      {result.neighbors.length > 0 && (
        <div className="similar-items-section">
          <div className="similar-items-label">Similar Items (used for voting):</div>
          <div className="similar-items-list">
            {result.neighbors.slice(0, 5).map((neighbor, idx) => {
              const neighborColor = categoryColors[neighbor.item.category] || categoryColors.Other;
              const neighborEmoji = categoryEmojis[neighbor.item.category] || categoryEmojis.Other;
              const similarityPercent = Math.round(neighbor.similarity * 100);
              return (
                <div key={idx} className="similar-item">
                  <div className="similar-item-header">
                    <span className="similar-item-name">{neighbor.item.name}</span>
                    <span className="similar-item-similarity">{similarityPercent}%</span>
                  </div>
                  <div className="similar-item-category" style={{ backgroundColor: neighborColor }}>
                    {neighborEmoji} {formatCategoryName(neighbor.item.category)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

