import { promise } from './util'

test('not-installed', () => {
  expect(() => promise('key', Promise.resolve(1)))
    .toThrow(/\[vue-vuex-promise-store]/)
})
