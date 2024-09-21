import * as React from 'react'

import { cn } from '@/entrypoints/content/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  wrapperClassName?: string;
  inputClassName?: string;
  startAdornmentClassName?: string;
  endAdornmentClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className,
  type,
  label,
  helperText,
  startAdornment,
  endAdornment,
  wrapperClassName,
  inputClassName,
  startAdornmentClassName,
  endAdornmentClassName,
  ...props
}, ref) => (
  <div className={cn('flex flex-col', wrapperClassName)}>
    {label && <label className='mb-1 text-sm text-gray-700'>{label}</label>}
    <div
      className={cn(
        'flex items-center h-10 w-full rounded-md border border-border-primary bg-background text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {startAdornment && <span className={cn('px-3 pr-0 text-sm text-muted-foreground', startAdornmentClassName)}>{startAdornment}</span>}
      <input
        type={type}
        className={cn(
          'flex-1 px-3 py-2 placeholder:text-placeholder focus:outline-none focus-visible:outline-none disabled:opacity-50 rounded-r-sm bg-transparent file:border-0 file:bg-transparent file:text-sm file:font-medium',
          inputClassName
        )}
        ref={ref}
        {...props}
      />
      {endAdornment && <span className={cn('px-3 text-sm text-muted-foreground', endAdornmentClassName)}>{endAdornment}</span>}
    </div>
    {helperText && <span className='mt-1 text-xs text-muted-foreground'>{helperText}</span>}
  </div>
))
Input.displayName = 'Input'

export { Input }
