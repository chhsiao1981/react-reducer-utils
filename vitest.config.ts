import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['tests/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
      environment: 'happy-dom',
      restoreMocks: true,

      // coverage for unit testing not enabled, because we have none!
      // coverage: {
      //   enabled: true,
      //   include: ["src/**"],
      //   reportsDirectory: "./coverage-vitest",
      // },

      server: {
        deps: {
          inline: [
            // workaround for 'Unknown file extension ".css"'
            // See https://github.com/vitest-dev/vitest/discussions/6138
          ],
        },
      },
    },
  }),
)
