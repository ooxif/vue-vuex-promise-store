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

## usage

```javascript
import PromiseStore, { promise } from 'vue-vuex-promise-store'

const store = new Vuex.Store({
  plugins: [PromiseStore.plugin({
    moduleName: 'promise'
  })]
})

const uniqueKey = 'unique key is required'

// first time for the unique key
async function initialInvocation() {
  const context = promise(uniqueKey, (resolve => {
    console.log('first')

    setTimeout(() => {
      console.log('third')
      resolve(1)
    }, 0);
  }))
    .thenSync((value) => {
      console.log('fourth', value) // 1
      // thenSync() does not change the promise state nor the resolved value
      // regardless of the returned value
    })
    .thenSync((value) => {
      console.log('fifth', value) // 1
    })

  console.log('second')

  // context.promise is a Promise
  const last = await context.promise

  console.log('sixth', last) // 1
}

await initialInvocation()

async function secondInvocation() {
  // second time for the unique key
  const context = promise(uniqueKey, (resolve => {
    // a result for the unique key is already in the store.
    // this promise executor is not invoked,
    // and following thenSync()s are executed synchronously.
  }))
    .thenSync((value) => {
      console.log('first', value) // 1
    })

  console.log('second')

  const last = await p.promise

  console.log('third', last) // 1
}
```

## usage (resolve, reject)

```javascript
import PromiseStore, { promise, resolve, reject } from 'vue-vuex-promise-store'

const store = new Vuex.Store({
  plugins: [PromiseStore.plugin()]
})

let cache = null

function fetchRemoteData () {
  if (cache) {
    return cache.status ? resolve(cache.value) : reject(cache.value)
  }
  
  return promise('remoteData', fetch('http://example.com/path/to/remoteData'))
    .thenSync((value) => {
      cache = { value, status: true }
    }, (reason) => {
      cache = { status: false, value: reason }
    })
}

```
