# Client Best Practice

I recommend using [superjson](https://github.com/blitz-js/superjson) as the transformer. It is a superset of JSON that supports Dates, BigInts, and more.
this is not required, but it is a good practice.
using this transformer will make your life easier when working with dates, bigints, sets, maps, and other javascript/non-json types.

::: warning
Ensure that the server-side uses the same transformer.
:::

## Installation

```sh
npm install @http-rpc/client superjson
```

```ts
import { createClient } from '@http-rpc/client';
import type { Router } from './server';
import superjson from 'superjson';

export const client = createClient<Router>({
	url: 'http://localhost:3000/rpc',
	transformer: superjson,
	async headers() {
		const token = await getToken();
		return {
			Authorization: `Bearer ${token}`,
		};
	},
	onError(err) {
		console.error(err.response?.data?.title);
		return err;
	},
});
```

so if a server `Endpoint` returns a `Date` object, it will be automatically transformed to a `Date` object on the client-side.

for example:

::: code-group

```ts [server.ts]
export const someEndpoint = publicRoute.get(() => {
	return {
		someMap: new Map([['key', 'value']]),
		date: new Date(),
		primitive: 1,
	};
});
```

:::

::: code-group

```ts [client.ts]
const result = await client.someEndpoint();
// ^? { someMap: Map<string, string>, date: Date, primitive: number }
```

:::
