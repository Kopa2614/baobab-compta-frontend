'use client';
import { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <select
        {...props}
        className={`border rounded-xl px-3 py-2.5 text-sm bg-white text-gray-900
          focus:outline-none focus:ring-2 focus:ring-[#1B3A2D]/15 focus:border-[#1B3A2D]
          disabled:bg-gray-50 disabled:cursor-not-allowed cursor-pointer
          ${error ? 'border-red-400' : 'border-gray-200'} ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
