import React from 'react';

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled 
}) => {
  const colors = {
    primary: "bg-[#8B4513] text-white hover:bg-[#654321]",
    secondary: "bg-white text-gray-600 border border-gray-200 hover:bg-[#FDF5E6]",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
  };

  const paddingClass = variant === 'ghost' && className.includes('px-0') 
    ? 'px-0' 
    : 'px-4';

  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`inline-flex items-center justify-center ${paddingClass} py-2 rounded-lg font-medium transition-all ${colors[variant]} ${className} ${disabledClass}`}
    >
      {children}
    </button>
  );
};
