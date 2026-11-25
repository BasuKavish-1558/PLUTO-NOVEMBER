import { Avatar } from '@/components/layout/Avatar'
import type { Profile } from '@/data/db'
import { useMediaUrl } from './queries'

/** The signed-in user's avatar: local photo while it uploads, signed URL after, initials otherwise. */
export function ProfileAvatar({ profile, className }: { profile: Profile | null | undefined; className?: string }) {
  const src = useMediaUrl(profile?.avatar_path)
  return <Avatar name={profile?.name ?? ''} src={src} className={className} />
}
