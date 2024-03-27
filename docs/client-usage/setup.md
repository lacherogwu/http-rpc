# Setup

## Installation

```sh
npm i @http-rpc/client superjson
```

::: tip

- `superjson` is not required, but it is recommended to use it for serialization.

:::

## Usage

::: code-group

```ts {3} [rpc.ts]
import { createClient } from '@http-rpc/client';
import superjson from 'superjson';
import type { Router } from '~server/rpc/router'; // Import the type from the server

export const rpc = createClient<Router>({
	url: 'http://localhost:3000/rpc',
	transformer: superjson,
});
```

:::

::: code-group

```ts [index.ts]
import { rpc } from './rpc';

const version = await rpc.version.get();
//    ^? { version: string }
```

:::
