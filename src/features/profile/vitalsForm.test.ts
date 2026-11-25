import { describe, expect, it } from 'vitest'
import { heightDraft, parseAge, parseHeight, parseWeight, weightDraft } from './vitalsForm'

describe('parseAge', () => {
  it('accepts whole numbers in range', () => {
    expect(parseAge('27')).toEqual({ ok: true, value: 27 })
  })

  it.each(['', '12', '121', '27.5', 'abc'])('rejects %j', (text) => {
    expect(parseAge(text).ok).toBe(false)
  })
})

describe('parseWeight', () => {
  it('stores kg as typed and lb converted', () => {
    expect(parseWeight('80', 'kg')).toEqual({ ok: true, value: 80 })
    expect(parseWeight('176.4', 'lb')).toEqual({ ok: true, value: 80.014 })
  })

  it('accepts a decimal comma', () => {
    expect(parseWeight('80,5', 'kg')).toEqual({ ok: true, value: 80.5 })
  })

  it('checks the range in kg and reports it in the chosen unit', () => {
    expect(parseWeight('19', 'kg')).toEqual({ ok: false, error: 'Enter a weight from 20 to 400 kg' })
    expect(parseWeight('40', 'lb')).toEqual({ ok: false, error: 'Enter a weight from 45 to 881 lbs' })
  })

  it('pre-fills in the display unit', () => {
    expect(weightDraft(80, 'lb')).toBe('176.4')
    expect(weightDraft(null, 'kg')).toBe('')
  })
})

describe('parseHeight', () => {
  it('reads cm or feet and inches', () => {
    expect(parseHeight({ cm: '178', ft: '', in: '' }, 'cm')).toEqual({ ok: true, value: 178 })
    expect(parseHeight({ cm: '', ft: '5', in: '10' }, 'ft_in')).toEqual({ ok: true, value: 177.8 })
  })

  it('treats empty inches as zero', () => {
    expect(parseHeight({ cm: '', ft: '6', in: '' }, 'ft_in')).toEqual({ ok: true, value: 182.9 })
  })

  it('rejects 12 or more inches and out-of-range heights', () => {
    expect(parseHeight({ cm: '', ft: '5', in: '12' }, 'ft_in').ok).toBe(false)
    expect(parseHeight({ cm: '300', ft: '', in: '' }, 'cm').ok).toBe(false)
  })

  it('pre-fills both representations from stored cm', () => {
    expect(heightDraft(177.8)).toEqual({ cm: '177.8', ft: '5', in: '10' })
  })
})
