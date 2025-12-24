
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
    'rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100',
    {
        variants: {
            variant: {
                primary: 'bg-orange-400 text-white shadow-md shadow-orange-200',
                secondary: 'bg-stone-200 text-stone-700 hover:bg-stone-300',
                outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                ghost: 'bg-transparent text-stone-500 hover:text-stone-700',
                danger: 'bg-red-400 text-white',
            },
            size: {
                sm: 'px-3 py-1.5 text-sm',
                md: 'px-4 py-2.5 text-base',
                lg: 'px-6 py-3.5 text-lg',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ className, variant, size, icon, children, ...props }) => {
    return (
        <button
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        >
            {icon && <span className="mr-2 h-4 w-4">{icon}</span>}
            {children}
        </button>
    );
};

export { Button, buttonVariants };
