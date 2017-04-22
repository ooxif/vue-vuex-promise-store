const MODULE_NAME = 'promise'

let defaultStore
let defaultModuleName

function each (object, iteratee) {
  return Object.keys(object).forEach((key) => {
    iteratee(object[key], key)
  })
}

function noop () {}

function handleSync (context, handler) {
  handler(context.isFulfilled ? context.value : context.reason)
}

function runSyncQueue (context, promiseState, value, syncQueue) {
  const isFulfilled = promiseState === true
  const isPending = promiseState === null
  const isRejected = promiseState === false

  Object.assign(context, {
    isFulfilled,
    isPending,
    isRejected,

    reason: isRejected ? value : undefined,
    value: isFulfilled ? value : undefined
  })

  if (isPending) {
    context.promise = value

    return
  }

  if (!syncQueue.length) return

  let item

  while ((item = syncQueue.shift())) {
    (item[0] === isFulfilled) && handleSync(context, item[1])
  }
}

function attachMethods (context, store, moduleName, key) {
  const syncQueue = []

  context.thenSync = function thenSync (onFulfilled, onRejected) {
    if (context.isPending) {
      onFulfilled && syncQueue.push([true, onFulfilled])
      onRejected && syncQueue.push([false, onRejected])

      return context
    }

    if (context.isFulfilled && onFulfilled) {
      handleSync(context, onFulfilled)
    }

    if (context.isRejected && onRejected) {
      handleSync(context, onRejected)
    }

    return context
  }

  context.catchSync = function catchSync (onRejected) {
    return context.thenSync(undefined, onRejected)
  }

  function commit (promiseState, value) {
    let state = store.state[moduleName]
    let update = false

    if (state.enabled && state.contexts[key] === context) {
      update = true
      store.commit(`${moduleName}/update`, {
        key,
        promiseState,
        syncQueue,
        value
      })
    }

    !update && runSyncQueue(context, promiseState, value, syncQueue)

    return context.isFulfilled ? context.value : Promise.reject(context.reason)
  }

  context.promise = context.promise.then(
    value => commit(true, value),
    value => commit(false, value)
  )
}

function createContext (promiseOrExecutor, store, moduleName, key) {
  const context = {
    isFulfilled: false,
    isPending: true,
    isRejected: false,
    promise: typeof promiseOrExecutor === 'function'
      ? new Promise(promiseOrExecutor)
      : promiseOrExecutor,
    reason: undefined,
    value: undefined
  }

  attachMethods(context, store, moduleName, key)

  return context
}

function resolveAllThen ({ commit, dispatch, getters }, mutation) {
  return new Promise((resolve) => {
    function cb () {
      commit(mutation)

      resolve()
    }

    getters.hasPendingPromises ? dispatch('resolveAll').then(cb) : cb()
  })
}

function registerModule (store, moduleName) {
  const state = store.state[moduleName]

  store.registerModule(moduleName, {
    namespaced: true,

    state: {
      enabled: state && 'enabled' in state ? !!state.enabled : true,
      contexts: Object.assign(
        Object.create(null),
        (state && state.contexts) || {}
      )
    },

    actions: {
      disable (actionContext) {
        return resolveAllThen(actionContext, 'disable')
      },

      finalize (actionContext) {
        return resolveAllThen(actionContext, 'finalize')
      },

      resolveAll ({ getters }) {
        return Promise.all(getters.pendingPromises.map(p => p.catch(noop)))
      }
    },

    getters: {
      hasPendingPromises (state, getters) {
        return !!getters.pendingPromises.length
      },

      installed () {
        return true
      },

      pendingPromises (state) {
        const promises = []

        each(state.contexts, (context) => {
          const p = context.promise

          p && promises.push(p)
        })

        return promises
      }
    },

    mutations: {
      create (state, { context, key }) {
        state.contexts = { ...state.contexts, [key]: context }
      },

      disable (state) {
        state.enabled = false
        state.contexts = Object.create(null)
      },

      enable (state) {
        state.enabled = true
      },

      finalize (state) {
        each(state.contexts, (context) => {
          Object.assign(context, {
            catchSync: undefined,
            promise: undefined,
            thenSync: undefined
          })
        })
      },

      restore (state, { key }) {
        const context = state.contexts[key]

        if (!context || context.isPending) return

        let p = context.promise

        if (!p || !p.then) {
          p = context.isFulfilled
            ? Promise.resolve(context.value)
            : Promise.reject(context.reason)

          context.promise = p
        }

        !context.thenSync && attachMethods(context, store, moduleName, key)
      },

      update (state, { key, promiseState, syncQueue, value }) {
        const context = state.contexts[key]

        if (!context) return

        runSyncQueue(context, promiseState, value, syncQueue)
      }
    }
  })
}

function promise (key, promiseOrExecutor, options = {}) {
  const store = options.store || defaultStore

  if (!store) throw new Error('vue-vuex-promise-store is not installed.')

  const moduleName = options.moduleName || defaultModuleName

  if (!store.getters[`${moduleName}/installed`]) {
    registerModule(store, moduleName)
  }

  const state = store.state[moduleName]

  if (!state.enabled) {
    return createContext(promiseOrExecutor, store, moduleName, key)
  }

  const refresh = !!options.refresh
  let context = state.contexts[key]

  if (!refresh && context) {
    if (context.thenSync) return context

    if (!context.isPending) {
      store.commit(`${moduleName}/restore`, { key })

      return state.contexts[key]
    }
  }

  store.commit(`${moduleName}/create`, {
    key,
    context: createContext(promiseOrExecutor, store, moduleName, key)
  })

  return state.contexts[key]
}

function plugin (options = {}) {
  return function promiseStorePlugin (store) {
    defaultStore = store
    defaultModuleName = options.moduleName || MODULE_NAME

    registerModule(store, defaultModuleName)
  }
}

export default {
  MODULE_NAME,
  plugin,
  promise,
  version: '__VERSION__'
}
