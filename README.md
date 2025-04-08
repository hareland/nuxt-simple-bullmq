# Nuxt Simple BullMQ Module

[![Build](https://github.com/hareland/nuxt-simple-bullmq/actions/workflows/test.yml/badge.svg)](https://github.com/hareland/nuxt-simple-bullmq/actions/workflows/test.yml)
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Simple Nuxt 3 module using [BullMQ](https://docs.bullmq.io/) and Redis for doing amazing things.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)


<!-- - [🏀 Online playground](https://stackblitz.com/github/your-org/nuxt-simple-bullmq?file=playground%2Fapp.vue) -->
<!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

- ⛰ &nbsp;Foo
- 🚠 &nbsp;Bar
- 🌲 &nbsp;Baz

## Quick Setup

Install the module in your Nuxt application with one command:

```bash
npx nuxi module add nuxt-simple-bullmq
```

> **NOTE**: This is only tested with NodeJS 21 (not cloudflare/vercel etc) and **Nuxt 4 with experimental features** (see test
workflows/files for more)

## Add the config

```javascript
// nuxt.config.ts
{
  runtimeConfig: {
    redis: {
      url: 'redis://localhost:6379'
    }
  },
  bullMq: {
    // Where to load defined workers from (defineWorker files)
    // this is optional, and will default to [ '<serverDir>/workers' ]
    workerDirs: [ '/workers' ], // base path will be your "serverDir" e.g ./server/some-path
  }
}
```

**or use `NUXT_REDIS_URL` in your $environment**

That's it! You can now use BullMQ in your Nuxt app ✨

## Usage

### **Workers**
A worker lives in its own file and each worker is registered as a separate nitro plugin.

```typescript 
// ./server/workers/default,ts
export default defineWorker('default', {
  async sendWelcomeEmail({job, logger, lockId}) {
    logger.info(`Sending welcome email to ${job.data.email}`)
  },

  // magic catch-all event handler (for uncaught events):
  catchAll({job, logger}) {
    logger.debug(`Uncaught event: ${job.name}!`, job.data)
  }
}, {
  //optional: default //comment
  concurrency: 1, //how many of each worker to run
});
```

### **Jobs**

Jobs are handled through callbacks, they can be in their own files, defined directly on the worker etc.

> **Note**: There is no typing for dispatching jobs - yet :/ 
One solution can be to use a constant mapping e.g `const JobNames = {someKey: 'someValue'}`

```typescript
// ./server/jobs/sendWelcomeEmail.ts
export default defineJobHandler(({job, logger}) => {
  logger.debug(job.name, job.data)
})
```

**Validated job handlers**

```typescript
// ./server/jobs/sendWelcomeEmail.ts
import {z} from 'zod';

export default defineValidatedJobHandler(
  z.object({userId: z.string()}),
  async ({data, job, logger}) => {
    // data contains the validated payload from the schema
  },
);
```
> **Note**: Validates input before processing the job

**Delaying jobs**
```typescript 
// ./server/jobs/delayedExecution.ts
import { DelayedError } from 'bullmq';

export default defineJobHandler(async ({job, logger, lockId}) => {
  if (!await somePrecondition()) {
    await job.moveToDelayed(Date.now() + 5_000, lockId)
    throw new DelayedError();
  }

  logger.info('Here we are in a delayed state.')
})
  ```

### **Dispatching Jobs**

```typescript
// ./server/route/dispatch.ts
import {dispatchJob} from '#imports'

export default defineEventHandler(async event => {
  await dispatchJob(
    'sendWelcomeEmail', 
    {userId: 'abc'},
    // Optional:
    {queueName: 'default', attempts: 1, backoff: {strategy: 'exponential', } },
  )
})
```

**Validated job dispatch**
```typescript
// ./server/route/typed-dispatch.ts
import {dispatchValidatedJob} from '#imports'

export default defineEventHandler(async event => {
  await dispatchValidatedJob(
    'sendWelcomeEmail',
    z.object({userId: z.string()}),
    {userId: 'abc'},
    {queueName: 'default'},
  )
})
```

> This will validate the input before emitting the job to redis

**Additional options**
> You can pass the same options that are passed as the third argument when calling `emit` to `dispatchJob` and `dispatchValidatedJob` as well. 
```typescript
// ./server/route/name.ts
import {useQueue} from '#imports'

//e.g using H3 event handlers
export default defineEventHandler(async event => {
  const queue = useQueue('default');
  await queue.emit('sendWelcomeEmail', {userId: 'some-string'}, {
    //Optionals (with their defaults)
    queueName: 'default',

    //optionals without defaults
    deduplicationId: 'some-string', // can be anything, defaults to the event name.
    ttl: 500, // when the deduplication should expire
    delay: 500, // a delay to when this will run (good for notifications)
  })

  //validate schema first:
  await queue.emit('sendWelcomeEmail', {userId: 'some-string'}, {
    schema: z.object({userId: z.string()}), // optional
    //... other options 
  })
})
```

## Roadmap

- [X] Add handlers
- [X] Worker per plugin
- [X] Validation dispatch/handler
- [ ] File based listeners (Laravel style)
- [ ] Different lib/platform (e.g Vercel/Cloudflare)


## Contribution

<details>
  <summary>Local development</summary>

  ```bash
  # Install dependencies
  npm install
  
  # Generate type stubs
  npm run dev:prepare
  
  # run redis via docker (add -s to detach and continue using the terminal for other stuff)
  docker compose -f ./playground/compose.yml up [-d]
  
  # to stop docker stuff:
  docker compose -f ./playground/compose.yml down
  
  # Develop with the playground
  npm run dev
  
  # Build the playground
  npm run dev:build
  
  # Run ESLint
  npm run lint
  
  # Run Vitest
  npm run test
  npm run test:watch
  
  # Release new version
  npm run release
  ```

</details>


<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nuxt-simple-bullmq/latest.svg?style=flat&colorA=020420&colorB=00DC82

[npm-version-href]: https://npmjs.com/package/nuxt-simple-bullmq

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-simple-bullmq.svg?style=flat&colorA=020420&colorB=00DC82

[npm-downloads-href]: https://npm.chart.dev/nuxt-simple-bullmq

[license-src]: https://img.shields.io/npm/l/nuxt-simple-bullmq.svg?style=flat&colorA=020420&colorB=00DC82

[license-href]: https://npmjs.com/package/nuxt-simple-bullmq

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js

[nuxt-href]: https://nuxt.com
