// @ts-check
if (!Object.groupBy) {
  Object.groupBy = (arr, fn) => arr.reduce((acc, item) => {
    const key = fn(item)
    ;(acc[key] = acc[key] || []).push(item)
    return acc
  }, {})
}

import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt()
// Your custom configs here
