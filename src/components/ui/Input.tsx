'use client';
import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        {...props}
        className={`border rounded-xl px-3 py-2.5 text-sm bg-white text-gray-900
          placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-[#1B3A2D]/15 focus:border-[#1B3A2D]
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-200'}
          ${className}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
