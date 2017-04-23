import * as u from './util'

test('registers a module', () => {
  expect(u.state(u.createStore()).enabled).toBe(true)
})

test('action finalize', async () => {
  const store = u.createStore()
  const key = 'key'
  let counter = 1

  const context = u.promise(key, (resolve) => {
    u.toBe(counter += 1, 2)
    resolve(counter)
  })
    .thenSync((value) => {
      u.toBe(value, 2)
      u.toBe(counter += 1, 4)
    })

  u.toBe(counter += 1, 3)

  await u.dispatch(store, 'finalize')

  u.toBe(counter, 4)
  u.isFinalized(context, {
    isFulfilled: true,
    value: 2
  })
  u.inStore(context, store, key)
})

test('disable => enable', async () => {
  const store = u.createStore()

  u.toBe(u.state(store).enabled, true)

  await u.dispatch(store, 'disable')

  u.toBe(u.state(store).enabled, false)

  u.dispatch(store, 'enable')

  u.toBe(u.state(store).enabled, true)
})
