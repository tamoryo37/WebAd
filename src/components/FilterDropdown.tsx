import { useState, useRef, useEffect } from 'react';
import { Filter, X } from 'lucide-react';

type FilterDropdownProps = {
  column: string;
  values: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  isActive: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function FilterDropdown({
  column,
  values,
  selectedValues,
  onToggle,
  onClear,
  isActive,
  onOpenChange
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onOpenChange(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onOpenChange]);

  const handleToggleDropdown = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange(newState);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={handleToggleDropdown}
        className={`p-1 rounded hover:bg-gray-200 transition-colors ${
          selectedValues.length > 0 ? 'text-blue-600' : 'text-gray-400'
        }`}
      >
        <Filter size={14} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2 flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">フィルター</span>
            {selectedValues.length > 0 && (
              <button
                onClick={() => {
                  onClear();
                  setIsOpen(false);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <X size={12} />
                クリア
              </button>
            )}
          </div>
          <div className="p-2 space-y-1">
            {values.map((value) => (
              <label
                key={value}
                className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(value)}
                  onChange={() => onToggle(value)}
                  className="rounded"
                />
                <span className="text-gray-700">{value}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
