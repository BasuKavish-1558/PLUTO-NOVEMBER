import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import type { Profile } from '@/data/db'
import { setAvatar } from '@/data/repos/profile'
import { PhotoButtons } from './PhotoButtons'
import { ProfileAvatar } from './ProfileAvatar'

type Props = { profile: Profile; open: boolean; onOpenChange: (open: boolean) => void }

export function AvatarDrawer({ profile, open, onOpenChange }: Props) {
  async function pick(image: Blob | null) {
    await setAvatar(profile, image)
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-md">
        <DrawerHeader>
          <DrawerTitle>Profile photo</DrawerTitle>
          <DrawerDescription>Take a new photo or choose one from your gallery.</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col items-center gap-5 px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <ProfileAvatar profile={profile} className="size-28 text-4xl" />
          <PhotoButtons hasPhoto={!!profile.avatar_path} onPick={pick} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
