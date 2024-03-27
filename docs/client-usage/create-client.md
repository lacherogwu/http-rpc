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
