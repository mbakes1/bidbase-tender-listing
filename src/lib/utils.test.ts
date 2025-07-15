import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })
})