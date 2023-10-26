import { test, expect } from 'bun:test'
import { formatTab } from './utils'

test('formatTab [["foobar", "qux"], ["foo", "quxquz"]]', async () => {
  const result = formatTab([['foobar', 'qux'], ['foo', 'quxquz']])
  expect(result).toEqual([
    'foobar qux   ',
    'foo    quxquz'
  ])
})
