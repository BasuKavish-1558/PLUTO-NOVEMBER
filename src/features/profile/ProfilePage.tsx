import { PageHeader } from '@/components/layout/PageHeader'
import { AccountCard } from './AccountCard'
import { AppearanceCard } from './AppearanceCard'
import { BodyCard } from './BodyCard'
import { IdentityCard } from './IdentityCard'
import { InstallCard } from './InstallCard'
import { PreferencesCard } from './PreferencesCard'
import { useProfile } from './queries'
import { PageSkeleton } from '@/components/ui/skeleton'

export function ProfilePage() {
  const profile = useProfile()
  if (!profile) return <PageSkeleton cards={4} />

  return (
    <div className="space-y-5">
      <PageHeader title="Profile" />
      <IdentityCard profile={profile} />
      <AppearanceCard />
      <BodyCard profile={profile} />
      <PreferencesCard profile={profile} />
      <InstallCard />
      <AccountCard />
    </div>
  )
}
