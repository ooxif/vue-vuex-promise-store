# vue-vuex-promise-store

Wraps promises to save resolved data to vuex store.

## usage

```javascript
import promisePlugin, { promise } from 'vuex-promise'

const store = new Vuex.Store({
  plugins: [promisePlugin(
    moduleName: 'promise'
  )]
})

const uniqueKey = 'unique key is required'

// first time for the unique key
async function initialInvocation() {
  const p = promise(uniqueKey, (resolve => {
    setTimeout(() => {
      console.log('first')
      resolve(1)
    }, 0);
  }))
    .thenSync(value => {
      console.log('third', value) // 1
      // thenSync() does not change the promise state and resolved value
      // regardless of returned value
    })
    .thenSync((value) => {
      console.log('fourth', value) // 1
    })

  console.log('second')

  // p.promise is a Promise
  const last = await p.promise

  console.log('fifth', last) // 1
}

await initialInvocation()

async function secondInvocation() {
  // second time for the unique key
  const p = promise(uniqueKey, (resolve => {
    // a result for the unique key is already in the store.
    // this promise executor is not invoked.
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
