'use client';

import { useState, useEffect, useRef } from 'react';
import { Textbook } from '@/types/database';
import { getTextbooks } from '@/lib/api';

interface TextbookInputProps {
  subjectId: string | null;
  value: string;
  onChange: (value: string) => void;
}

export default function TextbookInput({ subjectId, value, onChange }: TextbookInputProps) {
  const [suggestions, setSuggestions] = useState<Textbook[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Textbook[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadTextbooks() {
      if (!subjectId) return;
      try {
        const textbooks = await getTextbooks(subjectId);
        setSuggestions(textbooks);
      } catch (error) {
        console.error('Error loading textbooks:', error);
      }
    }
    loadTextbooks();
  }, [subjectId]);

  useEffect(() => {
    if (value.trim() === '') {
      setFilteredSuggestions(suggestions.slice(0, 5));
    } else {
      const filtered = suggestions.filter(t =>
        t.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setFilteredSuggestions(filtered);
    }
  }, [value, suggestions]);

  const handleSelect = (textbook: Textbook) => {
    onChange(textbook.name);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="교재명 입력"
        className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
      />

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
          {filteredSuggestions.map((textbook) => (
            <button
              key={textbook.id}
              type="button"
              onClick={() => handleSelect(textbook)}
              className="w-full px-4 py-3 text-left hover:bg-background transition-colors border-b border-border last:border-0"
            >
              {textbook.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
