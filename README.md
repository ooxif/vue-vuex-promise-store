# vue-vuex-promise-store

[![Version](https://img.shields.io/npm/v/vue-vuex-promise-store.svg)](https://www.npmjs.com/package/vue-vuex-promise-store)
[![License](https://img.shields.io/npm/l/vue-vuex-promise-store.svg)](https://www.npmjs.com/package/vue-vuex-promise-store)
[![Build Status](https://travis-ci.org/ooxif/vue-vuex-promise-store.svg)](https://travis-ci.org/ooxif/vue-vuex-promise-store)
[![CircleCI Status](https://circleci.com/gh/ooxif/vue-vuex-promise-store.svg?style=shield)](https://circleci.com/gh/ooxif/vue-vuex-promise-store)
[![Coverage Status](https://img.shields.io/coveralls/ooxif/vue-vuex-promise-store/master.svg)](https://coveralls.io/github/ooxif/vue-vuex-promise-store?branch=master)
[![Code Climate Status](https://codeclimate.com/github/ooxif/vue-vuex-promise-store.svg)](https://codeclimate.com/github/ooxif/vue-vuex-promise-store)
[![codecov](https://codecov.io/gh/ooxif/vue-vuex-promise-store/branch/master/graph/badge.svg)](https://codecov.io/gh/ooxif/vue-vuex-promise-store)
[![Dependency Status](https://david-dm.org/ooxif/vue-vuex-promise-store.svg)](https://david-dm.org/ooxif/vue-vuex-promise-store)
[![devDependency Status](https://david-dm.org/ooxif/vue-vuex-promise-store/dev-status.svg)](https://david-dm.org/ooxif/vue-vuex-promise-store/?type=dev)
[![peerDependency Status](https://david-dm.org/ooxif/vue-vuex-promise-store/peer-status.svg)](https://david-dm.org/ooxif/vue-vuex-promise-store/?type=peer)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

Wraps promises to save resolved data to vuex store.

## Usage

```javascript
import PromiseStore from 'vue-vuex-promise-store'

const store = new Vuex.Store({
  plugins: [PromiseStore.plugin({
    moduleName: 'promise'
  })]
})

const uniqueKey = 'unique key is required'

// first time for the unique key
async function initialInvocation() {
  const context = store.getters['promise/init'](uniqueKey, (resolve) => {
    console.log('first')

    setTimeout(() => {
      console.log('third')
      resolve(1)
    }, 0)
  })
    .thenSync((value) => {
      console.log('fourth', value) // 1
      
      return 'hello'
    })
    .thenSync((value) => {
      console.log('fifth', value) // 'hello'
      
      return 'world'
    })
    .thenSync((value) => {
      console.log('sixth', value) // 'world'
      
      return '!'
    })

  console.log('second')

  // context.promise is a Promise
  const last = await context.promise

  console.log('seventh', last) // '!'
}

await initialInvocation()

async function secondInvocation() {
  // second time for the unique key
  const context = store.getters['promise/init'](uniqueKey, (resolve => {
    // a result for the `uniqueKey` is already in the store.
    // this promise executor is not invoked,
    // and following thenSync()s are executed synchronously.
  }))
    .thenSync((value) => {
      console.log('first', value) // 1
      
      return 'HELLO'
    })

  console.log('second')

  const last = await p.promise

  console.log('third', last) // 'HELLO'
}
```

## Usage (resolve, reject, wrap)

```javascript
import PromiseStore, { resolve, reject, wrap } from 'vue-vuex-promise-store'

const store = new Vuex.Store({
  plugins: [PromiseStore.plugin()]
})

let cache = null

function fetchRemoteData (useCache = false, ignoreStore = false) {
  if (useCache && cache) {
    return cache.status ? resolve(cache.value) : reject(cache.value)
  }
  
  const cb = resolve => resolve(fetch('http://example.com/path/to/remoteData'))

  if (ignoreStore) return wrap(cb)
  
  return store.getters['promise/init']('remoteData', cb)
    .thenSync((value) => {
      cache = { value, status: true }
      
      return value
    }, (reason) => {
      cache = { status: false, value: reason }
      
      throw reason
    })
}

fetchRemoteData().thenSync((value) => {
  // ...
}, (reason) => {
  // ...
})

```

## API

### Types

```
type OnFulfilledSync<T, U> = (value: T) => U
type OnRejectedSync<T> = (reason: Error) => T

type CatchSync<T> = (onRejected: OnRejectedSync<T>) => Context<T>
type ThenSync<T> = (onFulfilled: OnFulfilled<T>, onRejected?: OnRejected<T>) => Context<T>

type Context<T> = {
  isFulfilled: boolean, // true if or when the promise is fulfilled
  isPending: boolean, // ditto but is nether fulfilled nor rejected
  isRejected: boolean, // ditto but is rejected
  promise: Promise<T> | void,
  reason: Error | void, // the result of the rejected promise
  value: T | void, // the result of the fulfilled promise

  catchSync<U>: CatchSync<U> | void
  thenSync<U>: ThenSync<U> | void
}

type Resolve<T> = (value: T) => void
type Reject = (reason: Error) => void
type Executor<T> = (resolve: Resolve<T>, reject?: Reject) => void
type PromiseOrExecutor<T> = Promise<T> | Executor<T>

type ContextOptions = {
  refresh?: boolean
}

type PluginOptions = {
  moduleName?: string
}

type PluginInstaller = (store: Vuex.Store) => void
```

### Exports

- `MODULE_NAME: string`
  - is the default module name (is `'promise'`).
- `VERSION: string`
  - is the version number (like `'1.0.0'`).
- `plugin: (options?: PluginOptions) => PluginInstaller`
  - returns a plugin installer function with given options.
- `reject(reason: Error) => Context<void>`
- `resolve(value: T) => Context<T>`
- `wrap(promise: Promise<T>) => Context<T>`
  - returns a new `Context` object without stores.

### State

- `contexts: { [string]: Context }`
  - `Context` objects.
- `disabled: boolean`
  - true if store binding is disabled.
  - @see `disable()` action

### Actions

- `enable() => Promise<void>`
  - enables the store binding.
- `disable() => Promise<void>`
  - disables the store binding.
  - After disabling the store binding,
    `Context` objects are not stored in `state.contexts`.
- `finalize() => Promise<void>`
  - resolves all `Context` objects in `state.contexts`,
    then set `promise` `catchSync` `thenSync` to `undefined`.
  - Use this action to serialize `state`.
- `resolveAll() => Promise<void>`
  - resolves all pending `Context` objects.

### Getters

- `hasPendingPromises: boolean`
  - true if any pending `Context` objects are in `state.contexts`.
- `init: (key: string, promiseOrExecutor: PromiseOrExecutor<T>, options?: ContextOptions) => Context<T>`
  - is a function creates a new `Context` object,
    stores it in `state.contexts` with a given `key`
    if the store binding is not disabled,
    and finally returns it.
  - If a given `key` exists in `state.contexts` then returns it
    (instead of creating and storing a new object).
- `pendingPromises: Array<Context>`
  - is a function returns an array of pending `Context` objects
    in `state.contexts`.
