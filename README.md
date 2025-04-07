# Nuxt Simple BullMQ Module

[![Build](https://github.com/hareland/nuxt-simple-bullmq/actions/workflows/test.yml/badge.svg)](https://github.com/hareland/nuxt-simple-bullmq/actions/workflows/test.yml)
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Simple Nuxt 3 module using BullMQ and Redis for doing amazing things.

**NOTE**

This is only tested with NodeJS 21 (not cloudflare/vercel etc) and Nuxt 4 with experimental features (see test
workflows/files for more)

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

<!-- - [🏀 Online playground](https://stackblitz.com/github/your-org/nuxt-simple-bullmq?file=playground%2Fapp.vue) -->
<!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

<!-- Highlight some of the features your module provide here -->

- ⛰ &nbsp;Foo
- 🚠 &nbsp;Bar
- 🌲 &nbsp;Baz

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add nuxt-simple-bullmq
```

## Add the config to your nuxt.config.ts

```javascript
{
  runtimeConfig: {
    redis: {
      url: 'redis://localhost:6379'
    }
  }
}
```

**or use `NUXT_REDIS_URL` in your $environment**

That's it! You can now use BullMQ in your Nuxt app ✨

## Usage

### **Workers**
A worker lives in its own file and each worker is registered as a separate nitro plugin.
> **Note**: _There is no typing for emitting events yet :/_

```typescript 
// ./server/workers/default,ts

export default defineWorker('default', {
  async sendWelcomeEmail({job, logger}) {
    logger.info(`Sending welcome email to ${job.data.email}`)
  },

  // magic catch-all event handler (for uncaught events):
  catchAll({job, logger}) {
    logger.debug(`Uncaught event: ${job.name}!`, job.data)
  }
});
```

### **Jobs**


**Simple job handler**
```typescript
// ./server/jobs/sendWelcomeEmail.ts
export default defineJobHandler(({job, logger}) => {
  logger.debug(job.name, job.data)
})
```

**Validated job handlers**
> Validates input before processing the job

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

### **Dispatching Jobs**

**Dispatching a single job**
```typescript
// ./server/route/dispatch.ts
import {dispatchJob} from '#imports'

export default defineEventHandler(async event => {
  await dispatchJob('sendWelcomeEmail', {userId: 'abc'})
})
```

**Validated job dispatch**
> This will validate the input before emitting the job to redis
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

**Additional options**
> You can pass the same options to `dispatchJob` and `dispatchValidatedJob` as the last argument.
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
