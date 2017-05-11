const MODULE_NAME = 'promise'

let defaultStore
let defaultModuleName

function raise (message) {
  throw new Error(`[vue-vuex-promise-store] ${message}`)
}

function each (object, iteratee) {
  return Object.keys(object).forEach((key) => {
    iteratee(object[key], key)
  })
}

function noop () {}

function handleResolve (handler, value) {
  try {
    return [true, handler(value)]
  } catch (e) {
    return [false, e]
  }
}

function updateContext (context, isFulfilled, value, syncQueue) {
  context.isPending = false

  if (isFulfilled) {
    context.isFulfilled = true
    context.value = value
  } else {
    context.isRejected = true
    context.reason = value
  }

  if (!syncQueue.length) return

  const offset = isFulfilled ? 0 : 1
  let values

  while ((values = syncQueue.shift())) {
    const handler = values[offset + 2] // onFulfilled or onRejected

    const [ok, result] = handler
      ? handleResolve(handler, value)
      : [isFulfilled, value]

    ok ? values[0](result) : values[1](result)

    updateContext(values[4], ok, result, values[5])
  }
}

function attachMethods (context, store, moduleName, key, queue) {
  const syncQueue = queue || []

  context.thenSync = function thenSync (onFulfilled, onRejected) {
    if (!context.isPending) {
      let ok
      let result

      if (context.isFulfilled) {
        [ok, result] = onFulfilled
          ? handleResolve(onFulfilled, context.value)
          : [true, context.value]
      } else {
        [ok, result] = onRejected
          ? handleResolve(onRejected, context.reason)
          : [false, context.reason]
      }

      return createNoStoreContext(
        Promise[ok ? 'resolve' : 'reject'](result),
        ok,
        result
      )
    }

    let newContext
    let queueValues
    let newSyncQueue = []

    const p = new Promise((resolve, reject) => {
      queueValues = [resolve, reject]
    })

    newContext = createNoStoreContext(p, null, newSyncQueue)
    syncQueue.push([
      ...queueValues,
      onFulfilled,
      onRejected,
      newContext,
      newSyncQueue
    ])

    return newContext
  }

  context.catchSync = function catchSync (onRejected) {
    return context.thenSync(undefined, onRejected)
  }

  function commit (promiseState, value) {
    let state = store && store.state[moduleName]

    if (state && state.enabled && state.contexts[key] === context) {
      store.commit(`${moduleName}/update`, {
        key,
        promiseState,
        syncQueue,
        value
      })
    } else {
      updateContext(context, promiseState, value, syncQueue)
    }

    return context.isFulfilled
      ? context.value
      : Promise.reject(context.reason)
  }

  context.promise = context.promise.then(
    value => commit(true, value),
    reason => commit(false, reason)
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

  attachMethods(context, store, moduleName, key, [])

  return context
}

function createNoStoreContext (promise, state, value) {
  const context = {
    isFulfilled: state === true,
    isPending: state === null,
    isRejected: state === false,
    promise: promise,
    reason: state === false ? value : undefined,
    value: state === true ? value : undefined
  }

  attachMethods(
    context,
    undefined,
    undefined,
    undefined,
    state === null ? value : []
  )

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
      enable ({ commit }) {
        commit('enable')
      },

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
          if (context.isPending) {
            const p = context.promise

            p && promises.push(p)
          }
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

        !context && raise(`Failed to restore() an unknown key: ${key}`)

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

        if (!context) raise(`Failed to update() an unknown key: ${key}`)

        updateContext(context, promiseState, value, syncQueue)
      }
    }
  })
}

function promise (key, promiseOrExecutor, options = {}) {
  const store = options.store || defaultStore

  !store && raise('vue-vuex-promise-store is not installed')

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

function resolve (value) {
  return createNoStoreContext(Promise.resolve(value), true, value)
}

function reject (reason) {
  return createNoStoreContext(Promise.reject(reason), false, reason)
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
  reject,
  resolve,
  version: '__VERSION__'
}
