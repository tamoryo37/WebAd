import { useState, useRef, useEffect } from 'react';

type EditableCellProps = {
  value: any;
  campaignId: string;
  field: string;
  type?: 'text' | 'number' | 'date' | 'select';
  options?: { value: string; label: string }[];
  isEditing: boolean;
  editingValue: any;
  onStartEdit: (campaignId: string, field: string, value: any) => void;
  onValueChange: (value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  displayValue?: string;
  columnWidth?: number;
};

export default function EditableCell({
  value,
  campaignId,
  field,
  type = 'text',
  options,
  isEditing,
  editingValue,
  onStartEdit,
  onValueChange,
  onSave,
  onCancel,
  displayValue,
  columnWidth
}: EditableCellProps) {
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  if (isEditing) {
    if (type === 'select' && options) {
      return (
        <td className="px-3 py-1" style={{ width: columnWidth }}>
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editingValue}
            onChange={(e) => onValueChange(e.target.value)}
            onBlur={onSave}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </td>
      );
    }

    if (type === 'date') {
      return (
        <td className="px-3 py-1" style={{ width: columnWidth }}>
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={editingValue}
            onChange={(e) => onValueChange(e.target.value)}
            onBlur={onSave}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </td>
      );
    }

    if (type === 'number') {
      return (
        <td className="px-3 py-1" style={{ width: columnWidth }}>
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={editingValue}
            onChange={(e) => onValueChange(Number(e.target.value))}
            onBlur={onSave}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </td>
      );
    }

    return (
      <td className="px-3 py-1" style={{ width: columnWidth }}>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={editingValue}
          onChange={(e) => onValueChange(e.target.value)}
          onBlur={onSave}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </td>
    );
  }

  return (
    <td
      className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap cursor-pointer hover:bg-blue-50 transition-colors"
      onDoubleClick={() => onStartEdit(campaignId, field, value)}
      style={{ width: columnWidth }}
      title="ダブルクリックで編集"
    >
      {displayValue !== undefined ? displayValue : (value !== null && value !== undefined && value !== '' ? value.toString() : '-')}
    </td>
  );
}
