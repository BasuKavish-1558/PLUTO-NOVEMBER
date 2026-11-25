import { AlertTriangle, ChevronRight, CloudCheck, CloudUpload, KeyRound, LogOut, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { FormDrawer } from '@/components/layout/FormDrawer'
import { useSheet } from '@/components/layout/useSheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { flushBeforeSignOut, signOut } from '@/data/auth'
import { ChangePasswordDrawer } from './ChangePasswordDrawer'
import { DeleteAccountDrawer } from './DeleteAccountDrawer'
import { usePendingSyncCount, useSyncFailures } from './queries'
import { SyncFailuresDrawer } from './SyncFailuresDrawer'

const plural = (n: number) => `${n} change${n === 1 ? '' : 's'}`

export function AccountCard() {
  const pending = usePendingSyncCount() ?? 0
  const failures = useSyncFailures() ?? []
  const failuresSheet = useSheet()
  const [busy, setBusy] = useState(false)
  const [unsynced, setUnsynced] = useState(0)
  const confirm = useSheet()
  const remove = useSheet()
  const password = useSheet()

  async function doSignOut() {
    try {
      await signOut()
    } catch {
      toast.error("Couldn't sign out. Check your connection and try again.")
      setBusy(false)
    }
  }

  async function onSignOut() {
    setBusy(true)
    const left = await flushBeforeSignOut()
    if (left === 0) return doSignOut()
    setUnsynced(left)
    setBusy(false)
    confirm.show()
  }

  return (
    <Card className="space-y-4">
      <h2 className="font-semibold">Account</h2>
      <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        {pending ? <CloudUpload className="size-4" /> : <CloudCheck className="size-4" />}
        {pending ? `${plural(pending)} waiting to sync` : 'All changes synced'}
      </p>
      {failures.length > 0 && (
        <button
          type="button"
          onClick={failuresSheet.show}
          className="flex min-h-11 w-full items-center gap-2 rounded-xl bg-destructive/10 px-4 text-left text-sm font-medium text-destructive"
        >
          <AlertTriangle className="size-4 shrink-0" />
          <span className="flex-1">{plural(failures.length)} couldn't be saved</span>
          <ChevronRight className="size-4" />
        </button>
      )}
      <SyncFailuresDrawer failures={failures} open={failuresSheet.open} onOpenChange={failuresSheet.onOpenChange} />
      <Button variant="outline" className="w-full" onClick={password.show}>
        <KeyRound /> Change password
      </Button>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" className="sm:flex-1" disabled={busy} onClick={() => void onSignOut()}>
          <LogOut /> {busy ? 'Signing out…' : 'Sign out'}
        </Button>
        <Button variant="ghost" className="text-destructive hover:text-destructive sm:flex-1" onClick={remove.show}>
          <Trash2 /> Delete account
        </Button>
      </div>
      <FormDrawer
        key={`confirm-${confirm.key}`}
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Sign out anyway?"
        submitLabel="Sign out"
        submitVariant="destructive"
        onSubmit={doSignOut}
      >
        <p className="text-sm text-muted-foreground">
          {plural(unsynced)} haven't reached the server yet and will be lost. Connect to the internet first to keep them.
        </p>
      </FormDrawer>
      <ChangePasswordDrawer key={`password-${password.key}`} open={password.open} onOpenChange={password.onOpenChange} />
      <DeleteAccountDrawer key={`delete-${remove.key}`} open={remove.open} onOpenChange={remove.onOpenChange} />
    </Card>
  )
}
