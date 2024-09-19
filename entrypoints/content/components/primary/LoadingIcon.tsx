// Packages:
import React from 'react'
import { cn } from '../../lib/utils'

// Imports:
import { LoaderCircleIcon } from 'lucide-react'

// Functions:
const LoadingIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <LoaderCircleIcon
      {...props}
      className={cn('w-10 h-10 animate-spin text-brand-primary', props.className)}
    />
  )
}

// Exports:
export default LoadingIcon
