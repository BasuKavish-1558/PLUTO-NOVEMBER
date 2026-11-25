import { Camera, Pencil } from 'lucide-react'
import { useSheet } from '@/components/layout/useSheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Profile } from '@/data/db'
import { useUser } from '@/stores/session'
import { AvatarDrawer } from './AvatarDrawer'
import { EditProfileDrawer } from './EditProfileDrawer'
import { ProfileAvatar } from './ProfileAvatar'

export function IdentityCard({ profile }: { profile: Profile }) {
  const { email } = useUser()
  const photo = useSheet()
  const edit = useSheet()

  return (
    <Card className="flex items-center gap-4">
      <button
        type="button"
        onClick={photo.show}
        className="relative rounded-full transition-transform active:scale-95 motion-reduce:active:scale-100"
      >
        <ProfileAvatar profile={profile} className="size-16 text-xl" />
        <span className="sr-only">Change profile photo</span>
        <span className="absolute -right-0.5 -bottom-0.5 grid size-6 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground">
          <Camera className="size-3" />
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-semibold">{profile.name}</h2>
        <p className="truncate text-sm text-muted-foreground">{email}</p>
        {profile.age !== null && <p className="text-sm text-muted-foreground">{profile.age} years</p>}
      </div>
      <Button variant="ghost" size="icon" onClick={edit.show} aria-label="Edit profile">
        <Pencil />
      </Button>
      <AvatarDrawer key={`photo-${photo.key}`} profile={profile} open={photo.open} onOpenChange={photo.onOpenChange} />
      <EditProfileDrawer key={`edit-${edit.key}`} profile={profile} open={edit.open} onOpenChange={edit.onOpenChange} />
    </Card>
  )
}
