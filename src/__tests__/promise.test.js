/* eslint-disable prefer-promise-reject-errors */
import * as u from './util'

test('promise lifecycle (resolve)', async () => {
  const store = u.createStore()
  const key = 'key'
  const context = u.promise(key, Promise.resolve(1))

  u.isPending(context)
  u.inStore(context, store, key)

  await u.resolves(context, 1)

  u.isFulfilled(context, 1)
  u.inStore(context, store, key)
})

test('promise lifecycle (reject)', async () => {
  const store = u.createStore()
  const key = 'key'
  const context = u.promise(key, Promise.reject(1))

  u.isPending(context)
  u.inStore(context, store, key)

  await u.rejects(context, 1)

  u.isRejected(context, 1)
  u.inStore(context, store, key)
})

test('promise lifecycle (resolve thenSync)', async () => {
  const store = u.createStore()
  const key = 'key'
  let counter = 1

  const context1 = u.promise(key, (resolve) => {
    u.toBe(counter += 1, 2)
    resolve(counter)
  })
    .catchSync(u.notToBeCalled)
    .thenSync((value) => {
      u.toBe(value, 2)
      u.toBe(counter += 1, 4)
    }, u.notToBeCalled)
    .thenSync((value) => {
      u.toBe(value, 2)
      u.toBe(counter += 1, 5)
    }, u.notToBeCalled)

  u.isPending(context1)
  u.inStore(context1, store, key)
  u.toBe(counter += 1, 3)

  await u.resolves(context1, 2)

  u.toBe(counter += 1, 6)
  u.isFulfilled(context1, 2)
  u.inStore(context1, store, key)

  const context2 = u.promise(key, u.notToBeCalled)
    .catchSync(u.notToBeCalled)
    .thenSync((value) => {
      u.toBe(value, 2)
      u.toBe(counter += 1, 7)
    }, u.notToBeCalled)
    .thenSync((value) => {
      u.toBe(value, 2)
      u.toBe(counter += 1, 8)
    }, u.notToBeCalled)

  u.toBe(counter, 8)
  u.toBe(context2, context1)
  u.isFulfilled(context2, 2)
  u.inStore(context2, store, key)

  await u.resolves(context2, 2)

  u.toBe(counter, 8)
  u.isFulfilled(context2, 2)
  u.inStore(context2, store, key)
})

test('promise lifecycle (reject thenSync)', async () => {
  const store = u.createStore()
  const key = 'key'
  let counter = 1

  const context1 = u.promise(key, (resolve, reject) => {
    u.toBe(counter += 1, 2)
    reject(counter)
  })
    .thenSync(u.notToBeCalled, (value) => {
      u.toBe(value, 2)
      u.toBe(counter += 1, 4)
    })
    .catchSync((value) => {
      u.toBe(value, 2)
      u.toBe(counter += 1, 5)
    })

  u.isPending(context1)
  u.inStore(context1, store, key)
  u.toBe(counter += 1, 3)

  await u.rejects(context1, 2)

  u.toBe(counter += 1, 6)
  u.isRejected(context1, 2)
  u.inStore(context1, store, key)

  const context2 = u.promise(key, u.notToBeCalled)
    .thenSync(u.notToBeCalled, (value) => {
      u.toBe(value, 2)
      u.toBe(counter += 1, 7)
    }, u.notToBeCalled)
    .catchSync((value) => {
      u.toBe(value, 2)
      u.toBe(counter += 1, 8)
    })

  u.toBe(counter, 8)
  u.toBe(context2, context1)
  u.isRejected(context2, 2)
  u.inStore(context2, store, key)

  await u.rejects(context2, 2)

  u.toBe(counter, 8)
  u.isRejected(context2, 2)
  u.inStore(context2, store, key)
})

test('restored pending promise', async () => {
  const key = 'key'

  const store = u.createStore({}, {
    contexts: {
      [key]: u.createPending()
    }
  })

  let counter = 1

  const context = u.promise(key, (resolve) => {
    u.toBe(counter += 1, 2)
    resolve(counter)
  }).thenSync((value) => {
    u.toBe(value, 2)
    u.toBe(counter += 1, 4)
  })

  u.toBe(counter += 1, 3)
  u.isPending(context)
  u.inStore(context, store, key)

  await u.resolves(context, 2)

  u.toBe(counter, 4)
  u.isFulfilled(context, 2)
  u.inStore(context, store, key)
})

test('restored fulfilled promise', async () => {
  const key = 'key'

  const store = u.createStore({}, {
    contexts: {
      [key]: u.createFulfilled(2)
    }
  })

  let counter = 1

  const context = u.promise(key, u.notToBeCalled)
    .catchSync(u.notToBeCalled)
    .thenSync((value) => {
      u.toBe(value, 2)
      u.toBe(counter += 1, 2)
    })

  u.toBe(counter += 1, 3)
  u.isFulfilled(context, 2)
  u.inStore(context, store, key)

  await u.resolves(context, 2)

  u.toBe(counter, 3)
  u.isFulfilled(context, 2)
  u.inStore(context, store, key)
})

test('restored rejected promise', async () => {
  const key = 'key'

  const store = u.createStore({}, {
    contexts: {
      [key]: u.createRejected(2)
    }
  })

  let counter = 1

  const context = u.promise(key, u.notToBeCalled)
    .thenSync(u.notToBeCalled, (value) => {
      u.toBe(value, 2)
      u.toBe(counter += 1, 2)
    })

  u.toBe(counter += 1, 3)
  u.isRejected(context, 2)
  u.inStore(context, store, key)

  await u.rejects(context, 2)

  u.toBe(counter, 3)
  u.isRejected(context, 2)
  u.inStore(context, store, key)
})

test('disabled', async () => {
  const store = u.createStore()
  const key = 'key'
  let counter = 1

  const context1 = u.promise(key, (resolve) => {
    u.toBe(counter += 1, 2)
    resolve(2)
  })
    .thenSync((value) => {
      u.toBe(value, 2)
      u.toBe(counter += 1, 4)
    })

  u.toBe(counter += 1, 3)
  u.isPending(context1)
  u.inStore(context1, store, key)

  await u.resolves(context1, 2)

  u.toBe(counter, 4)
  u.isFulfilled(context1, 2)
  u.inStore(context1, store, key)

  const context2 = u.promise(key, u.notToBeCalled)
    .thenSync((value) => {
      u.toBe(value, 2)
      u.toBe(counter += 1, 5)
    })

  u.toBe(counter, 5)
  u.isFulfilled(context2, 2)
  u.toBe(context1, context2)
  u.inStore(context2, store, key)

  await u.dispatch(store, 'disable')

  u.isFulfilled(context2, 2)
  expect(u.state(store)).not.toHaveProperty(key)

  const context3 = u.promise(key, (resolve) => {
    u.toBe(counter += 1, 6)
    resolve(3)
  })
    .thenSync((value) => {
      u.toBe(value, 3)
      u.toBe(counter += 1, 8)
    })

  u.toBe(counter += 1, 7)
  u.isPending(context3)
  expect(context3).not.toBe(context2)
  expect(u.state(store)).not.toHaveProperty(key)

  await u.resolves(context3, 3)

  u.toBe(counter, 8)
  u.isFulfilled(context3, 3)
  expect(u.state(store)).not.toHaveProperty(key)

  const context4 = u.promise(key, (resolve) => {
    u.toBe(counter += 1, 9)
    resolve(4)
  })
    .thenSync((value) => {
      u.toBe(value, 4)
      u.toBe(counter += 1, 11)
    })

  u.toBe(counter += 1, 10)
  u.isPending(context4)
  expect(context4).not.toBe(context3)
  expect(u.state(store)).not.toHaveProperty(key)

  await u.resolves(context4, 4)

  u.toBe(counter, 11)
  u.isFulfilled(context4, 4)
  expect(u.state(store)).not.toHaveProperty(key)
})

test('with another store', async () => {
  const store1 = u.createStore()
  const store2 = u.createStore()
  const key = 'key'
  const module1 = 'promise1'
  const module2 = 'promise2'

  const context11 = u.promise(key, Promise.resolve(true), {
    store: store1,
    moduleName: module1
  })

  u.toBe(store1.state[module1].contexts[key], context11)

  const context12 = u.promise(key, Promise.resolve(true), {
    store: store1,
    moduleName: module2
  })

  u.toBe(store1.state[module1].contexts[key], context11)
  u.toBe(store1.state[module2].contexts[key], context12)

  const context21 = u.promise(key, Promise.resolve(true), {
    store: store2,
    moduleName: module1
  })

  u.toBe(store1.state[module1].contexts[key], context11)
  u.toBe(store1.state[module2].contexts[key], context12)
  u.toBe(store2.state[module1].contexts[key], context21)

  const context22 = u.promise(key, Promise.resolve(true), {
    store: store2,
    moduleName: module2
  })

  u.toBe(store1.state[module1].contexts[key], context11)
  u.toBe(store1.state[module2].contexts[key], context12)
  u.toBe(store2.state[module1].contexts[key], context21)
  u.toBe(store2.state[module2].contexts[key], context22)
})
