import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    '.next/**',
    '.next-app/**',
    '.next-build/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])
