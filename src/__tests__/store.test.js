/* eslint-disable prefer-promise-reject-errors */
import * as u from './util'

test('registers a module', () => {
  expect(u.state(u.createStore()).enabled).toBe(true)
})

test('action finalize', async () => {
  const store = u.createStore()
  const key = 'key'
  let counter = 1

  const context1 = u.promise(key, (resolve) => {
    u.toBe(counter += 1, 2)
    resolve(counter)

    return counter
  })

  const context2 = context1.thenSync((value) => {
    u.toBe(value, 2)
    u.toBe(counter += 1, 4)

    return counter
  })

  u.toBe(counter += 1, 3)

  await u.dispatch(store, 'finalize')

  u.toBe(counter, 4)
  u.isFinalized(context1, {
    isFulfilled: true,
    value: 2
  })
  u.inStore(context1, store, key)

  u.isFulfilled(context2, 4)
})

test('disable => enable', async () => {
  const store = u.createStore()

  u.toBe(u.state(store).enabled, true)

  await u.dispatch(store, 'disable')

  u.toBe(u.state(store).enabled, false)

  u.dispatch(store, 'enable')

  u.toBe(u.state(store).enabled, true)
})

test('pendingPromises', async () => {
  const store = u.createStore()

  const context1 = u.promise('key1', Promise.resolve(1))
  const context2 = u.promise('key2', () => {})
  const context3 = u.promise('key3', Promise.reject(3))
  const context4 = u.promise('key4', () => {})

  expect(Object.keys(u.state(store).contexts)).toHaveLength(4)
  expect(u.get(store, 'pendingPromises')).toHaveLength(4)

  await Promise.all([context1, context3.promise.catch(() => {})])

  expect(Object.keys(u.state(store).contexts)).toHaveLength(4)

  const pendingPromises = u.get(store, 'pendingPromises')

  expect(pendingPromises).toHaveLength(2)
  expect(pendingPromises).toContain(context2.promise)
  expect(pendingPromises).toContain(context4.promise)
})
