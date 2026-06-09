import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
};

export function Button({ variant = 'primary', className = '', children, ...props }: Props) {
  const variants = {
    primary: 'bg-[#1B5E20] text-white hover:bg-[#2E7D32]',
    secondary: 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
