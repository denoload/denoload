import { test, expect } from 'bun:test'
import { formatTab, parseDuration } from './utils'

test('formatTab [["foobar", "qux"], ["foo", "quxquz"]]', async () => {
  const result = formatTab([['foobar', 'qux'], ['foo', 'quxquz']])
  expect(result).toEqual([
    'foobar qux   ',
    'foo    quxquz'
  ])
})

test('parseDuration 3s', () => {
  expect(parseDuration('3s')).toBe(3)
})

test('parseDuration 1m3s', () => {
  expect(parseDuration('1m3s')).toBe(63)
})

test('parseDuration 3h61m2s', () => {
  expect(parseDuration('3h61m2s')).toBe(3 * 60 * 60 + 61 * 60 + 2)
})
