import React from 'react'
import { cva, VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const sectionVariants = cva('px-8 sm:px-10 md:px-8 lg:px-10 xl:px-12', {
  variants: {
    variant: {
      default: '',
      delimited: 'border-t-foreground/6',
      accent:
        'from-primary to-accent text-primary-foreground bg-gradient-to-b md:bg-linear-150 lg:bg-linear-120',
    },
    size: {
      default: 'my-12 max-w-368',
      book: 'my-12 max-w-180',
      full: 'max-w-full',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

const Section = ({
  children,
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'section'> & VariantProps<typeof sectionVariants>) => {
  return (
    <section
      className={cn(sectionVariants({ className, variant, size }))}
      {...props}
    >
      {children}
    </section>
  )
}

export default Section
