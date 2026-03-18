import React from 'react';

interface Props {
  value?: string;
  onChange: (date: string) => void;
  hasError?: boolean;
}

/** Converts DD/MM/YYYY → YYYY-MM-DD for the HTML date input */
function toInputValue(val?: string): string {
  if (!val) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const m = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}

/** Converts YYYY-MM-DD → DD/MM/YYYY for the form value */
function fromInputValue(val: string): string {
  if (!val) return '';
  const m = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return val;
}

export function DatePickerField({ value, onChange, hasError }: Props) {
  return React.createElement('input', {
    type: 'date',
    value: toInputValue(value),
    onChange: (e: any) => onChange(fromInputValue(e.target.value)),
    style: {
      border: `1.5px solid ${hasError ? '#ef4444' : '#d1d5db'}`,
      borderRadius: 8,
      padding: '11px 12px',
      fontSize: 15,
      color: value ? '#111827' : '#9ca3af',
      backgroundColor: '#fff',
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
    },
  } as any);
}
