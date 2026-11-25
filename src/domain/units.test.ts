import { describe, expect, it } from 'vitest'
import {
  cmToFtIn,
  formatHeight,
  formatWeight,
  ftInToCm,
  kgToLb,
  lbToKg,
  toDisplayWeight,
  toStoredHeight,
  toStoredWeight,
} from './units'

describe('weight', () => {
  it('converts kg and lb both ways', () => {
    expect(kgToLb(100)).toBeCloseTo(220.462, 3)
    expect(lbToKg(225)).toBeCloseTo(102.058, 3)
    expect(lbToKg(kgToLb(87.5))).toBeCloseTo(87.5, 9)
  })

  it('stores kg unchanged and lb converted to 3 decimals', () => {
    expect(toStoredWeight(80, 'kg')).toBe(80)
    expect(toStoredWeight(176.4, 'lb')).toBe(80.014)
    expect(toStoredWeight(225, 'lb')).toBe(102.058)
  })

  it('round-trips every typed lb value to the same display value', () => {
    for (let tenths = 400; tenths <= 8800; tenths += 7) {
      const typed = tenths / 10
      expect(toDisplayWeight(toStoredWeight(typed, 'lb'), 'lb')).toBe(typed)
    }
  })

  it('always maps the same lb input to the same kg', () => {
    expect(toStoredWeight(225, 'lb')).toBe(toStoredWeight(225, 'lb'))
  })

  it('displays with one decimal', () => {
    expect(toDisplayWeight(80.014, 'kg')).toBe(80)
    expect(toDisplayWeight(80, 'lb')).toBe(176.4)
    expect(formatWeight(80, 'kg')).toBe('80 kg')
    expect(formatWeight(72.35, 'kg')).toBe('72.4 kg')
    expect(formatWeight(80, 'lb')).toBe('176.4 lb')
  })
})

describe('height', () => {
  it('converts cm to feet and inches', () => {
    expect(cmToFtIn(182.88)).toEqual({ ft: 6, in: 0 })
    expect(cmToFtIn(178)).toEqual({ ft: 5, in: 10 })
    expect(cmToFtIn(152.4)).toEqual({ ft: 5, in: 0 })
  })

  it('carries 12 rounded inches into the next foot', () => {
    // 5′ 11.8″ rounds to 6′ 0″, never 5′ 12″
    expect(cmToFtIn(182.4)).toEqual({ ft: 6, in: 0 })
  })

  it('converts feet and inches to cm', () => {
    expect(ftInToCm({ ft: 6, in: 0 })).toBeCloseTo(182.88, 5)
    expect(ftInToCm({ ft: 5, in: 10 })).toBeCloseTo(177.8, 5)
  })

  it('stores height in cm with one decimal', () => {
    expect(toStoredHeight(178.04, 'cm')).toBe(178)
    expect(toStoredHeight({ ft: 5, in: 10 }, 'ft_in')).toBe(177.8)
    expect(toStoredHeight({ ft: 6, in: 2 }, 'ft_in')).toBe(188)
  })

  it('round-trips feet and inches through stored cm', () => {
    for (let ft = 3; ft <= 8; ft++) {
      for (let inches = 0; inches < 12; inches++) {
        const cm = toStoredHeight({ ft, in: inches }, 'ft_in')
        expect(cmToFtIn(cm)).toEqual({ ft, in: inches })
      }
    }
  })

  it('formats for display', () => {
    expect(formatHeight(178, 'cm')).toBe('178 cm')
    expect(formatHeight(177.8, 'ft_in')).toBe('5′ 10″')
  })
})
