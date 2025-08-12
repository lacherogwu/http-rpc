# Create Client

## What is a Client?

The client is the way to interact with the server. It is the code that makes requests to the server and receives responses.

## How to Create a Client

Creating a client is simple. You just need to import the `createClient` function and pass the server URL.

```ts
import { createClient } from '@http-rpc/client';
import type { Router } from './server';

export const client = createClient<Router>({
	url: 'http://localhost:3000/rpc',
});
```

`createClient(opts)` opts is an object with the following properties:

- `url`: The URL of the server.
- `transformer?`: A function that transforms the request and response.
- `headers?`: An object or a function that returns headers to be sent with every request.
- `onRequest?`: A function that is called before every request.
- `onResponse?`: A function that is called after every response.
- `onError?`: A function that is called when an error occurs.

## withCredentials Support

The client automatically sets `withCredentials: true` for all requests, enabling cookie-based authentication and CORS credentials:

```ts
const client = createClient<Router>({
	url: 'http://localhost:3000/rpc',
	async headers() {
		return {
			Authorization: 'Bearer token', // You still need to set headers manually
		};
	},
});

// All requests will automatically include cookies for authentication
// Authorization headers must be set manually via the headers option
const data = await client.users.list.get();
```

::: info About withCredentials
`withCredentials: true` automatically includes cookies in requests for cookie-based authentication. Authorization headers and other custom headers still need to be set manually using the `headers` option.
:::

## Server-Sent Events (SSE) - Experimental

::: warning Experimental Feature
SSE support is currently experimental and the API may change in future versions. Current limitations:

- No built-in error handling out of the box
- Basic implementation focused on core functionality
  :::You can consume Server-Sent Events using the `.sse()` method on the client:

```ts
// Connect to an SSE endpoint
const eventStream = await client.events.liveUpdates.sse({
	channel: 'notifications',
});

// Consume events using async iteration
for await (const data of eventStream) {
	console.log('Received data:', data);
	// Handle the real-time data
}
```

### Basic SSE Usage

```ts
// Simple SSE consumption
const eventStream = await client.events.liveUpdates.sse({
	channel: 'notifications',
});

for await (const data of eventStream) {
	console.log('Data received:', data);
	// data is exactly what the server yielded

	// You can break out of the loop based on your own logic
	if (someCondition) {
		break;
	}
}
```

### Current SSE Features

- **Input Validation**: Supports input parameters like regular endpoints
- **Output Validation**: Supports output schema validation - invalid data terminates the stream
- **Credentials**: Automatically includes cookies (withCredentials)
- **Real-time Streaming**: Low-latency data streaming from server to client
- **Type Safety**: TypeScript support for input parameters and output data

### Current Limitations

- **No Error Handling**: No built-in error handling out of the box

::: tip
SSE connections automatically include cookies via `withCredentials`, making them suitable for cookie-based authenticated real-time features. The browser's EventSource provides automatic reconnection, but you'll need to implement your own error handling logic.
:::
