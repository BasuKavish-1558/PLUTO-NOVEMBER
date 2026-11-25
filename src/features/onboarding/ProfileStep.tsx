import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Profile } from '@/data/db'
import { setAvatar, updateProfile } from '@/data/repos/profile'
import { PhotoButtons } from '@/features/profile/PhotoButtons'
import { ProfileAvatar } from '@/features/profile/ProfileAvatar'
import { MAX_NAME } from '@/features/profile/vitalsForm'
import { useUser } from '@/stores/session'

export function ProfileStep({ profile, onNext }: { profile: Profile; onNext: () => void }) {
  const { email } = useUser()
  const [name, setName] = useState(profile.name)
  const [error, setError] = useState<string>()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Enter your name')
    if (trimmed.length > MAX_NAME) return setError(`Use at most ${MAX_NAME} characters`)
    if (trimmed !== profile.name) await updateProfile(profile.id, { name: trimmed })
    onNext()
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-1 flex-col">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">About you</h1>
        <p className="text-muted-foreground">This is how you'll appear in Pluto. The photo is optional.</p>
      </div>
      <div className="mt-8 flex flex-col items-center gap-4">
        <ProfileAvatar profile={{ ...profile, name: name || profile.name }} className="size-24 text-3xl" />
        <PhotoButtons hasPhoto={!!profile.avatar_path} onPick={(image) => setAvatar(profile, image)} />
      </div>
      <div className="mt-8 space-y-5">
        <Field label="Name" htmlFor="name" error={error}>
          <Input
            id="name"
            autoComplete="name"
            autoFocus
            value={name}
            maxLength={MAX_NAME}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!error}
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" value={email} readOnly />
        </Field>
      </div>
      <Button type="submit" size="lg" className="mt-auto w-full">
        Continue
      </Button>
    </form>
  )
}
