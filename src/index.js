const MODULE_NAME = 'promise'

let enabled = true
let defaultStore
let defaultModuleName

function changeState (wrapped, promiseState, value) {
  wrapped.isFulfilled = promiseState === true
  wrapped.isPending = promiseState === null
  wrapped.isRejected = promiseState === false
  wrapped.reason = promiseState === false ? value : undefined
  wrapped.value = promiseState === true ? value : undefined

  if (promiseState === null) wrapped.promise = value
}

function invokeSync (wrapped, handler) {
  handler(wrapped.isFulfilled ? wrapped.value : wrapped.reason)
}

function startResolveSync (wrapped, promiseState, value, syncQueue) {
  changeState(wrapped, promiseState, value)

  if (!wrapped.isPending && syncQueue.length) {
    const currentPromiseState = wrapped.isFulfilled
    let item

    while ((item = syncQueue.shift())) { // eslint-disable-line no-cond-assign
      if (item[0] === currentPromiseState) {
        invokeSync(wrapped, item[1])
      }
    }
  }
}

function attachMethods (rawWrapped, store, moduleName, key) {
  const syncQueue = []

  rawWrapped.thenSync = function thenSync (onFulfilled, onRejected) {
    let wrapped
    let moduleState

    if (enabled) {
      moduleState = store.state[moduleName]

      if (!moduleState) return null

      wrapped = moduleState[key]

      if (!wrapped) return null
    } else {
      wrapped = rawWrapped
    }

    if (wrapped.isPending) {
      if (onFulfilled) syncQueue.push([true, onFulfilled])
      if (onRejected) syncQueue.push([false, onRejected])

      return wrapped
    }

    if (wrapped.isFulfilled && onFulfilled) {
      invokeSync(wrapped, onFulfilled)
    }

    if (wrapped.isRejected && onRejected) {
      invokeSync(wrapped, onRejected)
    }

    return wrapped
  }

  function commit (promiseState, value) {
    let wrapped

    if (enabled) {
      store.commit(`${moduleName}/update`, {
        key,
        promiseState,
        syncQueue,
        value
      })

      const moduleState = store.state[moduleName]

      if (!moduleState) {
        return Promise.reject(
          new Error(`Invalid state for module: ${moduleName}`)
        )
      }

      wrapped = moduleState[key]

      if (!wrapped) {
        return Promise.reject(
          new Error(`Invalid state for key: ${key} in module: ${moduleName}`)
        )
      }
    } else {
      wrapped = rawWrapped
      startResolveSync(wrapped, promiseState, value, syncQueue)
    }

    if (wrapped.isFulfilled) return wrapped.value
    if (wrapped.isRejected) return Promise.reject(wrapped.reason)

    return wrapped.promise
  }

  rawWrapped.promise = rawWrapped.promise.then(
    value => commit(true, value),
    value => commit(false, value)
  )

  rawWrapped.destroy = function destroy () {
    const length = syncQueue.length

    if (length) syncQueue.splice(0, length)

    if (enabled) {
      // eslint-disable-next-line no-underscore-dangle
      store.commit(`${moduleName}/destroy`, {
        key,
        deleteFunc: store._vm.$delete
      })
    }
  }
}

function registerModule (store, moduleName) {
  store.registerModule(moduleName, {
    namespaced: true,

    state: {},

    actions: {
      async finalize ({ commit, getters }) {
        const promises = getters.pendingPromises

        if (promises.length) {
          await Promise.all(promises.map(p => p.catch(() => {})))
        }

        commit('finalize')
      }
    },

    getters: {
      hasPendingPromises (state, getters) {
        return !!getters.pendingPromises.length
      },

      pendingPromises (state) {
        const promises = []

        Object.keys(state).forEach((key) => {
          const wrapped = state[key]

          if (wrapped.isPending) {
            const p = wrapped.promise

            if (p) promises.push(p)
          }
        })

        return promises
      }
    },

    mutations: {
      create (state, { key, wrapped, set }) {
        if (state[key]) {
          Object.assign(state[key], wrapped)
        } else {
          set(state, key, wrapped)
        }
      },

      destroy (state, { key, deleteFunc }) {
        if (state[key]) deleteFunc(state, key)
      },

      finalize (state) {
        Object.keys(state).forEach((wrapped) => {
          Object.assign(wrapped, {
            destroy: undefined,
            promise: undefined,
            thenSync: undefined
          })
        })
      },

      restore (state, { key }) {
        const wrapped = state[key]

        if (!wrapped || wrapped.isPending) return

        let promiseObj = wrapped.promise

        if (!promiseObj || !promiseObj.then) {
          promiseObj = wrapped.isFulfilled
            ? Promise.resolve(wrapped.value)
            : Promise.reject(wrapped.reason)

          wrapped.promise = promiseObj
        }

        if (!wrapped.thenSync) {
          attachMethods(wrapped, store, moduleName, key)
        }
      },

      update (state, { key, promiseState, syncQueue, value }) {
        const wrapped = state[key]

        if (!wrapped) return

        startResolveSync(wrapped, promiseState, value, syncQueue)
      }
    }
  })
}

function wrapPromise (promiseOrFactory, store, moduleName, key) {
  const wrapped = {
    isFulfilled: false,
    isPending: true,
    isRejected: false,
    promise: typeof promiseOrFactory === 'function'
      ? promiseOrFactory()
      : promiseOrFactory,
    reason: undefined,
    value: undefined
  }

  attachMethods(wrapped, store, moduleName, key)

  return wrapped
}

function getTarget (options) {
  const store = options.store || defaultStore

  if (!store) return {}

  const moduleName = options.moduleName || defaultModuleName || MODULE_NAME

  return {
    moduleName,
    store,
    state: store.state[moduleName]
  }
}

export function promise (key, promiseOrFactory, options = {}) {
  if (!enabled) return wrapPromise(promiseOrFactory)

  const target = getTarget(options)
  const { moduleName, store } = target
  let { state } = target

  if (!store) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('vue-vuex-promise-store is not installed.')
    }

    return null
  }

  const refresh = !!options.refresh

  if (!state) {
    registerModule(store, moduleName)
    state = store.state[moduleName]
  }

  let wrapped = state[key]

  if (!refresh && wrapped) {
    if (wrapped.thenSync) return wrapped

    if (!wrapped.isPending) {
      store.commit(`${moduleName}/restore`, {
        key,
        moduleName,
        store
      })

      return state[key]
    }
  }

  wrapped = wrapPromise(promiseOrFactory, store, moduleName, key)

  store.commit(`${moduleName}/create`, {
    key,
    wrapped,
    set: store._vm.$set // eslint-disable-line no-underscore-dangle
  })

  return wrapped
}

export function disable () {
  enabled = false
}

export function enable () {
  enabled = true
}

export function isEnabled () {
  return enabled
}

export function resolveAllPendingPromises (options = {}) {
  const { state } = getTarget(options)

  if (!state) return null

  const promises = []

  Object.keys(state).forEach((key) => {
    const wrapped = state[key]

    if (wrapped.isPending) {
      promises.push(wrapped.promise.catch(() => {}))
    }
  })

  return promises.length ? Promise.all(promises) : null
}

export function removeAll (options = {}) {
  const { state, store } = getTarget(options)

  if (!state) return

  Object.keys(state).forEach((key) => {
    // eslint-disable-next-line no-underscore-dangle
    store._vm.$delete(state, key)
  })
}

export const plugin = {
  vue: {
    install (Vue, options) {
      Vue.prototype.$promise = function $promise (key, promiseOrFactory) {
        return promise(key, promiseOrFactory, options)
      }
    }
  },

  vuex (options = {}) {
    if (!defaultModuleName) {
      defaultModuleName = options.moduleName || MODULE_NAME
    }

    return function promiseStorePlugin (store) {
      if (!defaultStore) defaultStore = store

      registerModule(store, defaultModuleName)
    }
  }
}
