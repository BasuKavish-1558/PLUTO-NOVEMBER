import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import type { Profile } from '@/data/db'
import { updateProfile } from '@/data/repos/profile'
import { UnitsPicker } from './UnitFields'

export function PreferencesCard({ profile }: { profile: Profile }) {
  return (
    <Card className="space-y-6">
      <h2 className="font-semibold">Preferences</h2>
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Units</h3>
        <UnitsPicker
          weightUnit={profile.weight_unit}
          lengthUnit={profile.length_unit}
          onChange={(weight_unit, length_unit) => void updateProfile(profile.id, { weight_unit, length_unit })}
        />
      </section>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="show-bmi" className="space-y-0.5">
          <span className="block">Show BMI</span>
          <span className="block text-sm text-muted-foreground">From your latest weight and height</span>
        </label>
        <Switch id="show-bmi" checked={profile.show_bmi} onCheckedChange={(show_bmi) => void updateProfile(profile.id, { show_bmi })} />
      </div>
    </Card>
  )
}
