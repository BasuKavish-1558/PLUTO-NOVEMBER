import { Switch as SwitchPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent p-0.5 outline-none transition-colors',
        // 28 px visual, 44 px hit area
        "after:absolute after:-inset-2 after:content-['']",
        'bg-input data-[state=checked]:bg-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-6 rounded-full bg-background shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] data-[state=checked]:translate-x-5 motion-reduce:transition-none" />
    </SwitchPrimitive.Root>
  )
}
