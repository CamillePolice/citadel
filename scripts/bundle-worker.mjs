import { build } from 'esbuild'

await build({
  entryPoints: ['server/tasks/refresh-prices.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: '.output/worker.mjs',
})
