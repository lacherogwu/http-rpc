# Events

## What are Events?

Events are a way to listen to certain actions that happen in the server. They are useful for logging, monitoring, and debugging.

## How to setup an Event?

```ts
import { createRoute } from '@http-rpc/server';
import { FastifyContext } from '@http-rpc/server/adapters/fastify';

export const publicRoute = createRoute<FastifyContext>();

publicRoute.on('afterMiddlewares', ctx => {
	ctx.req.log.info('afterMiddlewares');
});
```
