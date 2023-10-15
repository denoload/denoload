// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals, AssertionError, assertRejects } from './mod.ts'

Deno.test('assertRejects with return type', async () => {
  await assertRejects(async () => {
    return await Promise.reject(new Error())
  })
})

Deno.test('assertRejects with synchronous function that throws', async () => {
  await assertRejects(async () =>
    await assertRejects(() => {
      throw new Error()
    })
  )
  await assertRejects(
    async () =>
      await assertRejects(() => {
        throw { wrong: 'true' }
      }),
    AssertionError,
    'Function throws when expected to reject.'
  )
})

Deno.test('assertRejects with PromiseLike', async () => {
  await assertRejects(
    () => ({
      then () {
        throw new Error('some error')
      }
    }),
    Error,
    'some error'
  )
})

Deno.test('assertRejects with non-error value rejected and error class', async () => {
  await assertRejects(
    async () => {
      return await assertRejects(
        async () => {
          return await Promise.reject('Panic!')
        },
        Error,
        'Panic!'
      )
    },
    AssertionError,
    'A non-Error object was rejected.'
  )
})

Deno.test('assertRejects with non-error value rejected', async () => {
  await assertRejects(async () => {
    return await Promise.reject(null)
  })
  await assertRejects(async () => {
    return await Promise.reject(undefined)
  })
})

Deno.test('assertRejects with error class', async () => {
  await assertRejects(
    async () => {
      return await Promise.reject(new Error('foo'))
    },
    Error,
    'foo'
  )
})

Deno.test('assertRejects resolves with caught error', async () => {
  const error = await assertRejects(
    async () => {
      return await Promise.reject(new Error('foo'))
    }
  )
  assert(error instanceof Error)
  assertEquals(error.message, 'foo')
})

Deno.test('Assert Throws Async Parent Error', async () => {
  await assertRejects(
    async () => {
      return await Promise.reject(new AssertionError('Fail!'))
    },
    Error,
    'Fail!'
  )
})

Deno.test(
  'Assert Throws Async promise rejected with custom Error',
  async () => {
    class CustomError extends Error {}
    class AnotherCustomError extends Error {}
    await assertRejects(
      async () =>
        await assertRejects(
          async () => await Promise.reject(new AnotherCustomError('failed')),
          CustomError,
          'fail'
        ),
      AssertionError,
      'Expected error to be instance of "CustomError", but was "AnotherCustomError".'
    )
  }
)
