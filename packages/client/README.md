# HTTP RPC Client

## Documentation

Full documentation can be found [here](https://lacherogwu.github.io/http-rpc/).

## Installation

```bash
npm install @http-rpc/client superjson
```

## Usage

`./rpcClient.ts`

```typescript
import superjson from 'superjson';
import { createClient } from '@http-rpc/client';
import type { Router } from '../server/rpc/router';

export const client = createClient<Router>({
	url: 'http://localhost:3000/rpc',
	transformer: superjson,
	async headers() {
		const token = await getToken();

		return {
			Authorization: `Bearer ${token}`,
		};
	},
	/* Optional hooks */
	onRequest(req) {
		console.log(`${req.method?.toUpperCase() ?? 'Unknown'} ${req.url}`);
		return req;
	},
	onResponse(res) {
		console.log(`${res.status} ${res.statusText}`);
		return res;
	},
	onError(err) {
		console.error(err);
		return err;
	},
});
```

```typescript
import { client } from './rpcClient';

const version = await client.version.get();
//    ^? { version: string }

const orders = await client.orders.list({ fields: ['id', 'amount'] });
//    ^? { id: number, amount: number }[]
```
