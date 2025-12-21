import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, noPadding = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-2xl border-2 border-stone-100
        transition-all duration-200
        ${onClick ? 'active:scale-[0.98] cursor-pointer' : ''}
        ${noPadding ? '' : 'p-4'}
        ${className}
      `}
      style={{
        boxShadow: '4px 4px 0px #E0E5D5' // The requested soft shadow
      }}
    >
      {children}
    </div>
  );
};

export default Card;