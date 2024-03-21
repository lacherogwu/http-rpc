# HTTP RPC Client

## Installation

```bash
npm install @http-rpc/client
```

### Recommended Dependencies

```bash
npm install superjson
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
});
```

```typescript
import { client } from './rpcClient';

const version = await client.version.get();
// { version: '1.0.0' }

const orders = await client.orders.list({ fields: ['id', 'amount'] });
// [{ id: 1, amount: 100 }, { id: 2, amount: 200 }]
```
