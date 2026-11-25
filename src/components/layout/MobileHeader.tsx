import { Link, useLocation } from 'react-router'
import { ProfileAvatar } from '@/features/profile/ProfileAvatar'
import { useProfile } from '@/features/profile/queries'
import { pageTitle } from './nav'
import { ThemeToggle } from './ThemeToggle'

export function MobileHeader() {
  const { pathname } = useLocation()
  const profile = useProfile()

  return (
    <header className="sticky top-0 z-30 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-lg md:hidden">
      <div className="flex h-14 items-center gap-3 px-4">
        <Link
          to="/profile"
          className="-m-1 rounded-full p-1 transition-transform active:scale-95 motion-reduce:active:scale-100"
        >
          <ProfileAvatar profile={profile} />
          <span className="sr-only">Profile</span>
        </Link>
        <h1 className="flex-1 truncate text-lg font-semibold tracking-tight">{pageTitle(pathname)}</h1>
        <ThemeToggle />
      </div>
    </header>
  )
}
