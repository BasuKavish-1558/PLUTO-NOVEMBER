import { describe, expect, it } from 'vitest'
import { formatHold, formatSetText, MAX_HOLD_SECONDS, parseDuration, trackingOf } from './tracking'

describe('trackingOf', () => {
  it('measures every bodyweight exercise by reps only', () => {
    expect(trackingOf({ id: 'pull-up', equipment: 'bodyweight' })).toBe('reps')
    expect(trackingOf({ id: 'custom-bw', equipment: 'bodyweight' })).toBe('reps')
  })

  it('measures Dead Hang by time, whatever else is bodyweight', () => {
    expect(trackingOf({ id: 'cfe584af-8b5b-56d6-bb56-38b1ab417dbc', equipment: 'bodyweight' })).toBe('time')
  })

  it('keeps a weight box for the weighted bodyweight lifts, even though their equipment is Bodyweight', () => {
    for (const id of ['bf323334-f1e1-5084-9bd9-94ddbf1baec2', '4fb92502-3076-5611-9c76-0c0584d2cf42', 'b65792fc-76d6-593e-af3e-9395c251bfee']) {
      expect(trackingOf({ id, equipment: 'bodyweight' })).toBe('weight_reps')
    }
  })

  it('keeps weight × reps for everything with equipment', () => {
    for (const equipment of ['barbell', 'dumbbell', 'machine', 'cable']) expect(trackingOf({ id: 'x', equipment })).toBe('weight_reps')
  })
})

describe('parseDuration', () => {
  it('reads plain seconds and m:ss / h:mm:ss', () => {
    expect(parseDuration('45')).toBe(45)
    expect(parseDuration('90')).toBe(90)
    expect(parseDuration('1:30')).toBe(90)
    expect(parseDuration('0:45')).toBe(45)
    expect(parseDuration(' 2:05 ')).toBe(125)
    expect(parseDuration('1:00:00')).toBe(3600)
  })

  it('rejects empty, malformed, out-of-range and zero', () => {
    for (const bad of ['', '  ', 'abc', '1:', ':30', '1:60', '1:2:3:4', '-5', '1.5', '0', '0:00', '3601', '2:00:01']) {
      expect(parseDuration(bad), bad).toBeNull()
    }
    expect(MAX_HOLD_SECONDS).toBe(3600)
  })
})

describe('formatting', () => {
  it('shows a hold as m:ss', () => {
    expect(formatHold(45)).toBe('0:45')
    expect(formatHold(90)).toBe('1:30')
    expect(formatHold(3725)).toBe('1:02:05')
  })

  it('writes each kind of set the way it is measured', () => {
    expect(formatSetText({ weight_kg: 80, reps: 8 }, 'weight_reps', 'kg')).toBe('80 kg × 8')
    expect(formatSetText({ weight_kg: 80, reps: 8 }, 'weight_reps', 'lb')).toBe('176.4 lbs × 8')
    expect(formatSetText({ weight_kg: 0, reps: 8 }, 'weight_reps', 'kg')).toBe('BW × 8')
    expect(formatSetText({ weight_kg: 0, reps: 8 }, 'reps', 'kg')).toBe('8 reps')
    expect(formatSetText({ weight_kg: 0, reps: 1 }, 'reps', 'kg')).toBe('1 rep')
    expect(formatSetText({ weight_kg: 0, reps: 1, duration_seconds: 75 }, 'time', 'kg')).toBe('1:15')
  })

  it('ignores weight that an exercise no longer shows, and falls back to reps for old timed rows', () => {
    expect(formatSetText({ weight_kg: 10, reps: 6 }, 'reps', 'kg')).toBe('6 reps')
    expect(formatSetText({ weight_kg: 0, reps: 30 }, 'time', 'kg')).toBe('30 reps') // logged before time existed
  })
})
