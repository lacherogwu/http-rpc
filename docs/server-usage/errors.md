# Errors

## What are Errors?

Errors are a way to communicate with the client that something went wrong. Errors can be thrown at any point in the code and can be caught by the client.

The error format implement the [Problem Details for HTTP APIs - RFC 9457](https://datatracker.ietf.org/doc/html/rfc9457) specification.

## How to Throw an Error

```ts
import { RPCError } from '@http-rpc/server';

export const createProduct = protectedRoute.post(async ctx => {
	const { role } = ctx.user;
	if (role !== 'admin') throw new RPCError({ code: 'FORBIDDEN' });
});
```

## The Error Interface

The `RPCError` class implements the `ProblemDetails` interface.

```ts
interface ProblemDetails {
	type?: string;
	title?: string;
	status?: number;
	detail?: string;
	instance?: string;
	extensions?: Record<string, any>;
}
```

```ts
const error = new RPCError({
	code: 'FORBIDDEN', // maps to HTTP status code 403
	title: 'You are not allowed to perform this action',
	detail: 'Only admins can create products',
	type: 'https://example.com/docs/errors/forbidden',
	extensions: {
		currectRole: 'user',
		requiredRole: 'admin',
	},
});
```
