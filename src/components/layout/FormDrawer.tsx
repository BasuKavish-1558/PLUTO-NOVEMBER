import type { FormEvent, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  submitLabel: string
  submitVariant?: 'default' | 'destructive'
  busy?: boolean
  onSubmit: () => void | Promise<void>
  children: ReactNode
}

/** Bottom sheet with a form. Render it with useSheet()'s key so each opening starts fresh. */
export function FormDrawer({ open, onOpenChange, title, description, submitLabel, submitVariant, busy, onSubmit, children }: Props) {
  const submit = (e: FormEvent) => {
    e.preventDefault()
    void onSubmit()
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent className="mx-auto max-h-[90dvh] max-w-md">
        <form noValidate onSubmit={submit} className="flex min-h-0 flex-col">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription className={description ? undefined : 'sr-only'}>{description ?? title}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-5 overflow-y-auto px-4 pb-2">{children}</div>
          <div className="flex gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="lg" variant={submitVariant} className="flex-1" disabled={busy}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
