import { build } from 'esbuild'

await build({
  entryPoints: ['server/tasks/refresh-prices.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: '.output/worker.mjs',
  banner: {
    js: "import { createRequire } from 'module'; import { fileURLToPath } from 'url'; import { dirname } from 'path'; const require = createRequire(import.meta.url); const __filename = fileURLToPath(import.meta.url); const __dirname = dirname(__filename);",
  },
})
