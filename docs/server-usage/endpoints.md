# Endpoints

## What are Endpoints?

Endpoints are the final destination for a request. They are the functions that are executed when a request is made to the server.

Endpoints are applied to routes.

## How to Create an Endpoint

```ts
import { publicRoute, protectedRoute } from './route';

export const products = publicRoute.get(async () => {
	return [
		{ id: 1, name: 'Product 1' },
		{ id: 2, name: 'Product 2' },
		{ id: 3, name: 'Product 3' },
	];
});

export const createProduct = protectedRoute.post(async ctx => {
	// we have access to user because the protectedRoute middleware returned us the user object.
	const { username } = ctx.user;
	console.log(`User ${username} is creating a product`);
});
```

## Server-Sent Events (SSE) - Experimental

::: warning Experimental Feature
SSE support is currently experimental and the API may change in future versions. Current limitations:

- Output validation is not supported (cannot use `.output()` schemas)
- Basic implementation focused on core streaming functionality
  :::

Server-Sent Events allow the server to push data to the client in real-time. Use the `.sse()` method to create an SSE endpoint:

```ts
import { z } from 'zod';

export const liveUpdates = protectedRoute
	.input(
		z.object({
			channel: z.string(),
		}),
	)
	// Note: .output() is not supported for SSE endpoints
	.sse(async function* (ctx) {
		const { channel } = ctx.input;

		let counter = 0;
		while (true) {
			// Yield data to be sent to the client
			yield {
				counter,
				channel,
				timestamp: new Date(),
				message: `Update #${counter} for ${channel}`,
			};

			// Wait before sending next update
			await new Promise(resolve => setTimeout(resolve, 1000));
			counter++;
		}
	});
```

### SSE Endpoint Features:

- Uses a generator function (`function*`) that yields data
- Automatically sets appropriate SSE headers (`text/event-stream`, etc.)
- Supports input validation like regular endpoints
- Can access middleware context (user, auth, etc.)
- Sends data as JSON events to the client

### Current Limitations:

- **No Output Validation**: Cannot chain `.output()` for response schema validation
- Data yielded from the generator is sent as-is (with transformer if configured)
