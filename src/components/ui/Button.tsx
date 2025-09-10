/**
 * Button Component
 * 
 * A reusable button component with multiple variants and sizes.
 * Supports all standard button HTML attributes plus custom styling options.
 * 
 * @component
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={() => console.log('clicked')}>
 *   Click Me
 * </Button>
 * ```
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button content */
  children: React.ReactNode;
  /** Whether the button should take full width of its container */
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50';
  
  const variantStyles = {
    primary: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
    secondary: 'bg-gray-800 text-white hover:bg-gray-700 focus-visible:ring-gray-500',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-white',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white',
  };
  
  const sizeStyles = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 text-lg',
  };
  
  const widthStyles = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;