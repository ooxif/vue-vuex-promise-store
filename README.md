# vue-vuex-promise-store

Wraps promises to save resolved data to vuex store.

## usage

```javascript
import PromiseStore, { promise } from 'vue-vuex-promise-store'

const store = new Vuex.Store({
  plugins: [PromiseStore.plugin(
    moduleName: 'promise'
  )]
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
