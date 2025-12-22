import { Suggestion } from '../types';
import { categoryEmojis } from '../config/categoryEmojis';

interface SuggestionListProps {
  suggestions: Suggestion[];
  onSelect: (suggestion: string) => void;
  inputValue: string;
}

export function SuggestionList({
  suggestions,
  onSelect,
  inputValue,
}: SuggestionListProps) {
  if (suggestions.length === 0) {
    return null;
  }

  const highlightText = (text: string, prefix: string) => {
    if (!prefix) return text;
    const lowerText = text.toLowerCase();
    const lowerPrefix = prefix.toLowerCase();
    const index = lowerText.indexOf(lowerPrefix);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <strong>{text.substring(index, index + prefix.length)}</strong>
        {text.substring(index + prefix.length)}
      </>
    );
  };

  return (
    <div className="suggestion-list">
      {suggestions.map((suggestion, idx) => (
        <div
          key={idx}
          className="suggestion-item"
          onClick={() => onSelect(suggestion.name)}
        >
          <span className="suggestion-name">
            {highlightText(suggestion.name, inputValue)}
          </span>
          <span className="suggestion-category">
            {categoryEmojis[suggestion.category]} {suggestion.category}
          </span>
        </div>
      ))}
    </div>
  );
}

