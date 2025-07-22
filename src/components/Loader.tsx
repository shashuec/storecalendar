'use client';

import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'gradient' | 'minimal';
  text?: string;
  className?: string;
  showText?: boolean;
}

export default function Loader({ 
  size = 'medium', 
  variant = 'default',
  text = 'Loading...',
  className = '',
  showText = true
}: LoaderProps) {
  const sizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const variantClasses = {
    default: 'border-white/30 border-t-white',
    gradient: 'border-transparent bg-gradient-to-r from-blue-500 to-purple-500',
    minimal: 'border-current border-t-transparent'
  };

  if (variant === 'gradient') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
        <div className={cn(
          sizeClasses[size],
          'rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 animate-spin',
          'relative'
        )}>
          <div className={cn(
            'absolute inset-1 rounded-full bg-current',
'bg-transparent'
          )} />
        </div>
        {showText && text && (
          <div className={cn(
            'text-white/90 font-medium animate-pulse',
            textSizeClasses[size]
          )}>
            {text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className={cn(
        sizeClasses[size],
        'border-4 rounded-full animate-spin',
        variantClasses[variant]
      )} />
      {showText && text && (
        <div className={cn(
          'text-white/90 font-medium animate-pulse',
          textSizeClasses[size]
        )}>
          {text}
        </div>
      )}
    </div>
  );
}

// Specialized loader variants for common use cases
export function ButtonLoader({ size = 'small', className = '' }: { size?: 'small' | 'medium'; className?: string }) {
  return (
    <Loader 
      size={size} 
      variant="default" 
      showText={false} 
      className={cn('gap-0', className)} 
    />
  );
}

export function PageLoader({ text = 'Loading your content...', className = '' }: { text?: string; className?: string }) {
  return (
    <div className={cn('min-h-[200px] flex items-center justify-center', className)}>
      <Loader 
        size="large" 
        variant="gradient" 
        text={text}
        className="py-8"
      />
    </div>
  );
}

export function InlineLoader({ text = 'Processing...', className = '' }: { text?: string; className?: string }) {
  return (
    <Loader 
      size="small" 
      variant="minimal" 
      text={text}
      className={cn('flex-row gap-2', className)}
    />
  );
}