import Vue from 'vue'
import Vuex from 'vuex'
import PromiseStore from '../index'

Vue.use(Vuex)

export const MODULE_NAME = PromiseStore.MODULE_NAME

export const promise = PromiseStore.promise

export function createStore (options = {}, state = null) {
  return new Vuex.Store({
    state: state ? { [MODULE_NAME]: state } : {},
    plugins: [PromiseStore.plugin(options)]
  })
}

export function state (store) {
  return store.state[MODULE_NAME]
}

export function get (store, getter) {
  return store.getters[`${MODULE_NAME}/${getter}`]
}

export function dispatch (store, action, arg) {
  return store.dispatch(`${MODULE_NAME}/${action}`, arg)
}

export function commit (store, mutation, arg) {
  return store.commit(`${MODULE_NAME}/${mutation}`, arg)
}

export function createContext (opts) {
  return Object.assign({
    isFulfilled: false,
    isPending: false,
    isRejected: false,
    promise: {},
    reason: undefined,
    value: undefined
  }, opts)
}

export function createPending (opts = {}) {
  return createContext(Object.assign({ isPending: true }, opts))
}

export function createFulfilled (value, opts = {}) {
  return createContext(Object.assign({
    value,
    isFulfilled: true
  }, opts))
}

export function createRejected (reason, opts = {}) {
  return createContext(Object.assign({
    reason,
    isRejected: true
  }, opts))
}

export function isContext (context, opts) {
  expect(context).toEqual(expect.objectContaining(Object.assign({
    catchSync: expect.any(Function),
    isFulfilled: false,
    isPending: false,
    isRejected: false,
    promise: expect.any(Promise),
    reason: undefined,
    thenSync: expect.any(Function),
    value: undefined
  }, opts)))
}

export function isFinalized (context, opts = {}) {
  return isContext(context, Object.assign({
    catchSync: undefined,
    promise: undefined,
    thenSync: undefined
  }, opts))
}

export function isPending (context) {
  isContext(context, { isPending: true })
}

export function isFulfilled (context, value) {
  isContext(context, { value, isFulfilled: true })
}

export function isRejected (context, reason) {
  isContext(context, { reason, isRejected: true })
}

export function inStore (context, store, key) {
  expect(context).toBe(state(store).contexts[key])
}

export function resolves (context, expected) {
  return context.promise.then((value) => expect(value).toBe(expected))
}

export function rejects (context, expected) {
  return context.promise.catch((value) => expect(value).toBe(expected))
}

export function toBe (actual, expected) {
  expect(actual).toBe(expected)
}

export function notToBeCalled () {
  expect(jest.fn()()).not.toBeCalled()
}
