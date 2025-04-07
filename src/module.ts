import fs from 'node:fs'
import { join } from 'pathe'
import { defineNuxtModule, createResolver, addServerPlugin, addServerScanDir, addServerTemplate } from '@nuxt/kit'
import { consola } from 'consola'
import { getFilesInDirectoryRecursive } from './utils/files'

// Module options TypeScript interface definition
export interface ModuleOptions {
  workerDirs: string[]
  listenerDirs: string[]
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'bull-mq',
    configKey: 'bullMq',
  },
  // Default configuration options of the Nuxt module
  defaults: {
    workerDirs: [],
    listenerDirs: [],
  },
  async setup(_options, _nuxt) {
    const logger = consola.withTag('bullmq')
    const resolver = createResolver(import.meta.url)

    if (_nuxt.options._prepare) {
      logger.debug('Skipping module init due to nuxt.options._prepare = true')
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
      const workerFiles = await getFilesInDirectoryRecursive(workerDir)
      workers.push(...workerFiles)
    }

    for (const workerFile of workers) {
      addServerPlugin(workerFile)
    }

    // // _nuxt.options.alias['#bullmq-nuxt/manifest'] = 'build a template for the types here soemhow'
    // const queueJobList = await Promise.all(workers.map(async (file) => {
    //   const plugin = await import(file)
    // }))
    //
    // _nuxt.options.alias['#bullmq/types']
    const listenerDirs = [..._options.listenerDirs].map((dir) => {
      return join(_nuxt.options.srcDir, dir)
    }).filter(realPath => fs.existsSync(realPath))

    if (listenerDirs.length === 0) {
      const defaultListenersDir = join(_nuxt.options.serverDir, 'listeners')
      listenerDirs.push(defaultListenersDir)
    }

    const listeners: { name: string, fullPath: string }[] = []
    for (const listenerDir of listenerDirs) {
      const listenerFiles = await getFilesInDirectoryRecursive(listenerDir)
      listeners.push(...listenerFiles.map((file) => {
        return {
          name: file.replace(_nuxt.options.srcDir, ''),
          fullPath: file,
        }
      }))
    }

    // todo: add the content of each of these methods to the virtual filesystem so we can require them in our workers
    //  this should be separated on queueName so we cna get all listeners for a single queue at once.
    for (const { fullPath, name } of listeners) {
      logger.info(`Adding listener as serverTemplate: ${name} @ ${fullPath}`)
      addServerTemplate({
        filename: name,
        getContents: () => {
          const contents = fs.readFileSync(resolver.resolve(fullPath))
          return contents.toString()
        },
      })
    }
  },
})
