import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({ value, onChange, options, placeholder = "Select...", className = "", disabled = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Handle keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between px-4 py-2 bg-[#FFFFFF] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56] transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#0F6E56]/50'}`}
      >
        <span className={`block truncate ${selectedOption ? 'text-[#232420]' : 'text-[#6B6A62]'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#6B6A62] transition-transform ${isOpen ? 'rotate-180' : ''} shrink-0 ml-2`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#FFFFFF] border border-[#E4E1D8] rounded-[8px] shadow-lg max-h-60 overflow-y-auto outline-none">
          {options.length === 0 ? (
            <div className="px-4 py-2 text-sm text-[#6B6A62]">No options available</div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors hover:bg-[#FAF9F6] focus:bg-[#FAF9F6] focus:outline-none ${String(opt.value) === String(value) ? 'bg-[#FAF9F6] text-[#0F6E56] font-medium' : 'text-[#232420]'}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <span className="block truncate">{opt.label}</span>
                {String(opt.value) === String(value) && <Check className="w-4 h-4 shrink-0 ml-2 text-[#0F6E56]" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
