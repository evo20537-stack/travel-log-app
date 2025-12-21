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
        transition-all duration-200 cozy-shadow
        ${onClick ? 'active:scale-[0.98] cursor-pointer' : ''}
        ${noPadding ? '' : 'p-4'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
