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
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      )}
      <input
        {...props}
        className={`border rounded-lg px-3 py-2 text-sm bg-white text-gray-900
          placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-200'}
          ${className}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
