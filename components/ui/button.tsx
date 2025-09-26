import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        // Pixel art variants with Pepe-themed color scheme
        pixel:
          'pixel-button bg-[#6ECF68] text-black border-2 border-[#6ECF68] hover:bg-[#6ECF68]/80 hover:border-[#6ECF68]/80 font-press-start text-xs tracking-widest',
        pixelRed:
          'pixel-button bg-[#FF3B3B] text-white border-2 border-[#FF3B3B] hover:bg-[#FF3B3B]/80 hover:border-[#FF3B3B]/80 font-press-start text-xs tracking-widest',
        pixelPurple:
          'pixel-button bg-[#A259FF] text-white border-2 border-[#A259FF] hover:bg-[#A259FF]/80 hover:border-[#A259FF]/80 font-press-start text-xs tracking-widest',
        pixelYellow:
          'pixel-button bg-[#FFEA00] text-black border-2 border-[#FFEA00] hover:bg-[#FFEA00]/80 hover:border-[#FFEA00]/80 font-press-start text-xs tracking-widest',
        pixelOutline:
          'pixel-button bg-transparent text-white border-2 border-[#6ECF68] hover:bg-[#6ECF68]/20 font-press-start text-xs tracking-widest',
        pixelDark:
          'pixel-button bg-[#365E33] text-white border-2 border-[#6ECF68] hover:bg-[#365E33]/80 hover:border-[#6ECF68]/80 font-press-start text-xs tracking-widest',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        // Pixel art sizes
        pixel: 'h-10 px-4 py-2 rounded-none font-press-start text-xs',
        pixelLarge: 'h-12 px-6 py-3 rounded-none font-press-start text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }