---
title: Middlewares
---

# {{ $frontmatter.title }}

## What are Middlewares?

Middlewares are functions that execute before reaching the endpoint. They can be used to perform tasks such as authentication, logging, and more.

## How to Create a Middleware

Middleware can be applied at `Route` level or `Endpoint` level.

```ts
// Route level middleware
export const protectedRoute = publicRoute.middleware(async ctx => {
	const token = ctx.req.headers.authorization;
	if (!token) throw new RPCError({ code: 'UNAUTHORIZED' });

	const user = await getUserByToken(token);
	if (!user) throw new RPCError({ code: 'UNAUTHORIZED' });

	return { user };
});
```

```ts
// Endpoint level middleware
export const createProduct = protectedRoute
	.middleware(ctx => {
		const { role } = ctx.user;
		if (role !== 'admin') throw new RPCError({ code: 'FORBIDDEN' });
	})
	.post(async ctx => {
		// we have access to user because the protectedRoute middleware returned us the user object.
		const { username } = ctx.user;
		console.log(`User ${username} is creating a product`);
	});
```
