import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  allowOther?: boolean;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select options',
  allowOther = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [otherValue, setOtherValue] = useState('');

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const removeOption = (option: string) => {
    onChange(value.filter((v) => v !== option));
  };

  const addOther = () => {
    if (otherValue.trim()) {
      onChange([...value, otherValue.trim()]);
      setOtherValue('');
    }
  };

  return (
    <div className="relative">
      <div
        className="border border-neutral-300 rounded-lg p-3 cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((item) => (
            <span
              key={item}
              className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {item}
              <X
                className="w-4 h-4 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(item);
                }}
              />
            </span>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <span className={value.length === 0 ? 'text-neutral-400' : 'text-neutral-900'}>
            {value.length === 0 ? placeholder : `${value.length} selected`}
          </span>
          <ChevronDown className="w-5 h-5 text-neutral-500" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 border-b border-neutral-200 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          />
          {filteredOptions.map((option) => (
            <div
              key={option}
              className="p-3 hover:bg-neutral-50 cursor-pointer flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                toggleOption(option);
              }}
            >
              <input
                type="checkbox"
                checked={value.includes(option)}
                onChange={() => {}}
                className="w-4 h-4"
              />
              <span className="text-sm">{option}</span>
            </div>
          ))}
          {allowOther && (
            <div className="p-3 border-t border-neutral-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add other..."
                  value={otherValue}
                  onChange={(e) => setOtherValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOther();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addOther();
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
