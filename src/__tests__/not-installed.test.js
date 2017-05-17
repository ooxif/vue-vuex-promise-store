import { isPending, promise } from './util'

test('not-installed (with a promise)', () => {
  isPending(promise('key', Promise.resolve(1)))
})

test('not-installed (with a function)', () => {
  isPending(promise('key', () => Promise.resolve(1)))
})
