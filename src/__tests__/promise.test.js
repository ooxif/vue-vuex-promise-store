/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-throw-literal */
import * as u from './util'

test('promise lifecycle (resolve)', async () => {
  const store = u.createStore()
  const key = 'key'
  const context = u.promise(store, key, Promise.resolve(1))

  u.isPending(context)
  u.inStore(context, store, key)

  await u.resolves(context, 1)

  u.isFulfilled(context, 1)
  u.inStore(context, store, key)
})

test('promise lifecycle (reject)', async () => {
  const store = u.createStore()
  const key = 'key'
  const context = u.promise(store, key, Promise.reject(1))

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

  const a = u.promise(store, key, (resolve) => {
    u.toBe(counter += 1, 2)
    resolve('a')
  })

  const b = a.thenSync((value) => {
    u.toBe(value, 'a')
    counter += 1

    return 'b'
  }, u.notToBeCalled)

  const c = b.thenSync((value) => {
    u.toBe(value, 'b')
    counter += 1

    return 'c'
  }, u.notToBeCalled)

  const d = a.thenSync((value) => {
    u.toBe(value, 'a')
    counter += 1

    return 'd'
  }, u.notToBeCalled)

  u.toBe(counter += 1, 3)
  u.isPending(a)
  u.isPending(b)
  u.isPending(c)
  u.isPending(d)

  await u.resolves(a, 'a')

  u.toBe(counter += 1, 7)
  u.isFulfilled(a, 'a')
  u.isFulfilled(b, 'b')
  u.isFulfilled(c, 'c')
  u.isFulfilled(d, 'd')
  await u.resolves(b, 'b')
  await u.resolves(c, 'c')
  await u.resolves(d, 'd')
})

test('promise lifecycle (resolve thenSync in sync)', async () => {
  const store = u.createStore()

  const key = 'key'
  let counter = 1

  const a = u.promise(store, key, (resolve) => {
    u.toBe(counter += 1, 2)
    resolve('a')
  })

  u.toBe(counter += 1, 3)

  await u.resolves(a, 'a')

  u.toBe(counter += 1, 4)

  const b = a.thenSync((value) => {
    u.toBe(value, 'a')
    u.toBe(counter += 1, 5)

    return 'b'
  })

  u.isFulfilled(b, 'b')

  const c = b.thenSync((value) => {
    u.toBe(value, 'b')
    u.toBe(counter += 1, 6)

    return 'c'
  })

  u.isFulfilled(c, 'c')

  const d = a.thenSync((value) => {
    u.toBe(value, 'a')
    u.toBe(counter += 1, 7)

    return 'd'
  })

  u.isFulfilled(d, 'd')

  await u.resolves(b, 'b')
  await u.resolves(c, 'c')
  await u.resolves(d, 'd')
})

test('promise lifecycle (resolve thenSync without handlers', async () => {
  const store = u.createStore()

  const a = u.promise(store, 'key', (resolve) => {
    resolve('a')
  })

  const b = a.catchSync(u.notToBeCalled)

  await u.resolves(a, 'a')

  u.isFulfilled(a, 'a')
  u.isFulfilled(b, 'a')
})

test('promise lifecycle (reject thenSync)', async () => {
  const store = u.createStore()

  const key = 'key'
  let counter = 1

  const a = u.promise(store, key, (resolve, reject) => {
    u.toBe(counter += 1, 2)
    reject('a')
  })

  const b = a.thenSync(u.notToBeCalled, (value) => {
    u.toBe(value, 'a')
    counter += 1

    throw 'b'
  })

  const c = b.thenSync(u.notToBeCalled, (value) => {
    u.toBe(value, 'b')
    counter += 1

    throw 'c'
  })

  const d = a.thenSync(u.notToBeCalled, (value) => {
    u.toBe(value, 'a')
    counter += 1

    throw 'd'
  })

  u.toBe(counter += 1, 3)
  u.isPending(a)
  u.isPending(b)
  u.isPending(c)
  u.isPending(d)

  await u.rejects(a, 'a')

  u.toBe(counter += 1, 7)
  u.isRejected(a, 'a')
  u.isRejected(b, 'b')
  u.isRejected(c, 'c')
  u.isRejected(d, 'd')
  await u.rejects(b, 'b')
  await u.rejects(c, 'c')
  await u.rejects(d, 'd')
})

test('promise lifecycle (reject thenSync in sync)', async () => {
  const store = u.createStore()
  const key = 'key'
  let counter = 1

  const a = u.promise(store, key, (resolve, reject) => {
    u.toBe(counter += 1, 2)
    reject('a')
  })

  u.toBe(counter += 1, 3)

  await u.rejects(a, 'a')

  u.toBe(counter += 1, 4)

  const b = a.thenSync(u.notToBeCalled, (value) => {
    u.toBe(value, 'a')
    u.toBe(counter += 1, 5)

    throw 'b'
  })

  u.isRejected(b, 'b')

  const c = b.thenSync(u.notToBeCalled, (value) => {
    u.toBe(value, 'b')
    u.toBe(counter += 1, 6)

    throw 'c'
  })

  u.isRejected(c, 'c')

  const d = a.thenSync(u.notToBeCalled, (value) => {
    u.toBe(value, 'a')
    u.toBe(counter += 1, 7)

    throw 'd'
  })

  u.isRejected(d, 'd')

  await u.rejects(b, 'b')
  await u.rejects(c, 'c')
  await u.rejects(d, 'd')
})

test('promise lifecycle (reject thenSync without handlers', async () => {
  const store = u.createStore()

  const a = u.promise(store, 'key', (resolve, reject) => {
    reject('a')
  })

  const b = a.thenSync(u.notToBeCalled)

  await u.rejects(a, 'a')

  u.isRejected(a, 'a')
  u.isRejected(b, 'a')

  await u.rejects(b, 'a')
})

test('restored pending promise', async () => {
  const key = 'key'

  const store = u.createStore({}, {
    contexts: {
      [key]: u.createPending()
    }
  })

  let counter = 1

  const a = u.promise(store, key, (resolve) => {
    u.toBe(counter += 1, 2)
    resolve('a')
  })

  const b = a.thenSync((value) => {
    u.toBe(value, 'a')
    u.toBe(counter += 1, 4)

    return 'b'
  })

  u.toBe(counter += 1, 3)
  u.isPending(a)
  u.isPending(b)
  u.inStore(a, store, key)

  await u.resolves(a, 'a')

  u.toBe(counter, 4)
  u.isFulfilled(a, 'a')
  u.inStore(a, store, key)

  u.isFulfilled(b, 'b')

  await u.resolves(b, 'b')
})

test('restored fulfilled promise', async () => {
  const key = 'key'

  const store = u.createStore({}, {
    contexts: {
      [key]: u.createFulfilled('a')
    }
  })

  let counter = 1

  const a = u.promise(store, key, u.notToBeCalled)
  const b = a.catchSync(u.notToBeCalled)
  const c = b.thenSync((value) => {
    u.toBe(value, 'a')
    u.toBe(counter += 1, 2)

    return 'c'
  })

  u.toBe(counter += 1, 3)
  u.isFulfilled(a, 'a')
  u.isFulfilled(b, 'a')
  u.isFulfilled(c, 'c')
  u.inStore(a, store, key)

  await u.resolves(c, 'c')
  await u.resolves(b, 'a')
  await u.resolves(a, 'a')

  u.toBe(counter, 3)
  u.isFulfilled(a, 'a')
  u.isFulfilled(b, 'a')
  u.isFulfilled(c, 'c')
  u.inStore(a, store, key)
})

test('restored fulfilled promise (with an undefined promise)', async () => {
  const key = 'key'

  const store = u.createStore({}, {
    contexts: {
      [key]: u.createFulfilled('a', { promise: undefined })
    }
  })

  let counter = 1

  const a = u.promise(store, key, u.notToBeCalled)
  const b = a.catchSync(u.notToBeCalled)
  const c = b.thenSync((value) => {
    u.toBe(value, 'a')
    u.toBe(counter += 1, 2)

    return 'c'
  })

  u.toBe(counter += 1, 3)
  u.isFulfilled(a, 'a')
  u.isFulfilled(b, 'a')
  u.isFulfilled(c, 'c')
  u.inStore(a, store, key)
})

test('restored fulfilled promise (with a valid promise)', async () => {
  const key = 'key'

  const store = u.createStore({}, {
    contexts: {
      [key]: u.createFulfilled('a', { promise: Promise.resolve('a') })
    }
  })

  let counter = 1

  const a = u.promise(store, key, u.notToBeCalled)
  const b = a.catchSync(u.notToBeCalled)
  const c = b.thenSync((value) => {
    u.toBe(value, 'a')
    u.toBe(counter += 1, 2)

    return 'c'
  })

  u.toBe(counter += 1, 3)
  u.isFulfilled(a, 'a')
  u.isFulfilled(b, 'a')
  u.isFulfilled(c, 'c')
  u.inStore(a, store, key)
})

test('restored rejected promise', async () => {
  const key = 'key'

  const store = u.createStore({}, {
    contexts: {
      [key]: u.createRejected('a')
    }
  })

  let counter = 1

  const a = u.promise(store, key, u.notToBeCalled)
  const b = a.thenSync(u.notToBeCalled)
  const c = b.thenSync(u.notToBeCalled, (value) => {
    u.toBe(value, 'a')
    u.toBe(counter += 1, 2)

    throw 'c'
  })

  u.toBe(counter += 1, 3)
  u.isRejected(a, 'a')
  u.isRejected(b, 'a')
  u.isRejected(c, 'c')
  u.inStore(a, store, key)

  await u.rejects(c, 'c')
  await u.rejects(b, 'a')
  await u.rejects(a, 'a')

  u.toBe(counter, 3)
  u.isRejected(a, 'a')
  u.isRejected(b, 'a')
  u.isRejected(c, 'c')
  u.inStore(a, store, key)
})

test('disabled', async () => {
  const store = u.createStore()
  const key = 'key'
  let counter = 1

  const a1 = u.promise(store, key, (resolve) => {
    u.toBe(counter += 1, 2)
    resolve(2)
  })

  const a2 = a1.thenSync((value) => {
    u.toBe(value, 2)
    u.toBe(counter += 1, 4)

    return counter
  })

  u.toBe(counter += 1, 3)
  u.isPending(a1)
  u.isPending(a2)
  u.inStore(a1, store, key)

  await u.resolves(a1, 2)

  u.toBe(counter, 4)
  u.isFulfilled(a1, 2)
  u.isFulfilled(a2, 4)
  u.inStore(a1, store, key)

  const b1 = u.promise(store, key, u.notToBeCalled)
  const b2 = b1.thenSync((value) => {
    u.toBe(value, 2)
    u.toBe(counter += 1, 5)

    return counter
  })

  u.toBe(counter, 5)
  u.isFulfilled(b1, 2)
  u.isFulfilled(b2, 5)
  u.toBe(a1, b1)
  u.inStore(b1, store, key)

  await u.dispatch(store, 'disable')

  u.isFulfilled(b1, 2)
  u.isFulfilled(b2, 5)
  expect(u.state(store)).not.toHaveProperty(key)

  const c1 = u.promise(store, key, (resolve) => {
    u.toBe(counter += 1, 6)
    resolve(3)
  })
  const c2 = c1.thenSync((value) => {
    u.toBe(value, 3)
    u.toBe(counter += 1, 8)

    return counter
  })

  u.toBe(counter += 1, 7)
  u.isPending(c1)
  u.isPending(c2)
  expect(c1).not.toBe(b1)
  expect(u.state(store)).not.toHaveProperty(key)

  await u.resolves(c1, 3)

  u.toBe(counter, 8)
  u.isFulfilled(c1, 3)
  u.isFulfilled(c2, 8)
  expect(u.state(store)).not.toHaveProperty(key)

  const d1 = u.promise(store, key, (resolve) => {
    u.toBe(counter += 1, 9)
    resolve(4)
  })
  const d2 = d1.thenSync((value) => {
    u.toBe(value, 4)
    u.toBe(counter += 1, 11)

    return counter
  })

  u.toBe(counter += 1, 10)
  u.isPending(d1)
  u.isPending(d2)
  expect(d1).not.toBe(c1)
  expect(u.state(store)).not.toHaveProperty(key)

  await u.resolves(d1, 4)

  u.toBe(counter, 11)
  u.isFulfilled(d1, 4)
  u.isFulfilled(d2, 11)
  expect(u.state(store)).not.toHaveProperty(key)
})

test('resolve', async () => {
  let counter = 1

  const a = u.resolve('a')
  const b = a.thenSync((value) => {
    u.toBe(value, 'a')
    u.toBe(counter += 1, 2)

    return 'b'
  }, u.notToBeCalled)

  u.toBe(counter += 1, 3)
  u.isFulfilled(a, 'a')
  u.isFulfilled(b, 'b')

  await u.resolves(a, 'a')
  await u.resolves(b, 'b')
})

test('reject', async () => {
  let counter = 1

  const a = u.reject('a')
  const b = a.thenSync(u.notToBeCalled, (reason) => {
    u.toBe(reason, 'a')
    u.toBe(counter += 1, 2)

    throw 'b'
  })

  u.toBe(counter += 1, 3)
  u.isRejected(a, 'a')
  u.isRejected(b, 'b')

  await u.rejects(a, 'a')
  await u.rejects(b, 'b')
})

test('wrap', async () => {
  let counter = 1

  const a = u.wrap(Promise.resolve('a'))
  const b = a.thenSync((value) => {
    u.toBe(value, 'a')
    u.toBe(counter += 1, 3)

    return 'b'
  }, u.notToBeCalled)

  u.toBe(counter += 1, 2)

  u.isPending(a)
  u.isPending(b)

  await u.resolves(a, 'a')
  await u.resolves(b, 'b')

  u.isFulfilled(a, 'a')
  u.isFulfilled(b, 'b')
})
