// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

if (!Object.groupBy) {
  Object.groupBy = (arr, fn) =>
    arr.reduce((acc, item) => {
      const key = fn(item)
      ;(acc[key] = acc[key] || []).push(item)
      return acc
    }, {})
}

export default withNuxt({
  ignores: ['.claude/**'],
})
