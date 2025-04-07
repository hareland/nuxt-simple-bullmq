import fs from 'node:fs'
import { join } from 'pathe'
import { defineNuxtModule, createResolver, addServerPlugin, addServerScanDir } from '@nuxt/kit'
import { consola } from 'consola'
import { getFilesInDirectory } from './utils/files'

// Module options TypeScript interface definition
export interface ModuleOptions {
  workerDirs: string[]
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'simple-bullmq',
    configKey: 'bullMq',
  },
  // Default configuration options of the Nuxt module
  defaults: {
    workerDirs: [],
  },
  async setup(_options, _nuxt) {
    const logger = consola.withTag('bullmq')
    const resolver = createResolver(import.meta.url)

    if (_nuxt.options._prepare) {
      logger.info('_prepare')
      return
    }

    addServerScanDir([
      resolver.resolve('./runtime/server/nitro'),
    ])

    const workerDirs = [..._options.workerDirs].map((dir) => {
      return join(_nuxt.options.srcDir, dir)
    }).filter(realPath => fs.existsSync(realPath))

    if (workerDirs.length === 0) {
      const defaultWorkersDir = join(_nuxt.options.serverDir, 'workers')
      if (fs.existsSync(defaultWorkersDir)) {
        workerDirs.push(defaultWorkersDir)
      }
    }

    const workers = []
    for (const workerDir of workerDirs) {
      const workerFiles = await getFilesInDirectory(workerDir)
      workers.push(...workerFiles)
    }

    for (const workerFile of workers) {
      addServerPlugin(workerFile)
    }

    // // _nuxt.options.alias['#bullmq-nuxt/manifest'] = 'build a template for the types here soemhow'
    // const queueEventList = await Promise.all(workers.map(async (file) => {
    //   const plugin = await import(file)
    // }))
    //
    // _nuxt.options.alias['#bullmq/types']
  },
})
