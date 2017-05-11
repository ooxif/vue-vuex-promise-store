import PromiseStore from '../'

test('plugin (with options)', () => {
  const registerModule = jest.fn()

  PromiseStore.plugin({})({ registerModule, state: {} })

  expect(registerModule).toHaveBeenCalledTimes(1)
})

test('plugin (without options)', () => {
  const registerModule = jest.fn()

  PromiseStore.plugin()({ registerModule, state: {} })

  expect(registerModule).toHaveBeenCalledTimes(1)
})
