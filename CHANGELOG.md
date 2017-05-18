# Change Log

## [v1.0.0] - 2017-05-18

### BREAKING CHANGE

- remove `promise()` to avoid the [stateful singleton problem](https://ssr.vuejs.org/en/structure.html#avoid-stateful-singletons)
  - use `init` getter or `wrap()` instead
- change `version` to `VERSION`

### Added

- add `init` getters
- add `wrap()`

### Changed

- change `version` to `VERSION`

### Removed

- remove `promise()`

[v1.0.0]: https://github.com/ooxif/vue-vuex-promise-store/compare/v0.4.0...v1.0.0
