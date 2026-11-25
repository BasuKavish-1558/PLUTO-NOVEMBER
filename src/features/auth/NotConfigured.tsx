import { PlugZap } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function NotConfigured() {
  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2 font-semibold">
        <PlugZap className="size-5 text-primary" /> Supabase isn't connected
      </div>
      <p className="text-sm text-muted-foreground">
        Copy <code>.env.example</code> to <code>.env</code>, fill in <code>VITE_SUPABASE_URL</code> and{' '}
        <code>VITE_SUPABASE_ANON_KEY</code> from your Supabase project, then restart <code>npm run dev</code>.
      </p>
    </Card>
  )
}
