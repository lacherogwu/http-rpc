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
