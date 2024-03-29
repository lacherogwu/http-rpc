# Input & Output Validation

## What is Input & Output Validation?

Input & Output validation is the process of ensuring that the data received by the server is in the correct format and that the data sent by the server is in the correct format.

we use [zod](https://github.com/colinhacks/zod) for input & output validation.

## How to Validate Input

Input validation can be done using the `input` method on a `Route` or `Endpoint`.

```ts {2-8}
export const createUser = protectedRoute //
	.input(
		z.object({
			username: z.string(),
			password: z.string(),
			email: z.string().email(),
		}),
	)
	.post(async ctx => {
		const { username, password, email } = ctx.input;

		const user = await createUserRecord({ username, password, email });
		return user;
	});
```

## How to Validate Output

```ts {9-15}
export const createUser = protectedRoute
	.input(
		z.object({
			username: z.string(),
			password: z.string(),
			email: z.string().email(),
		}),
	)
	// Even though the function returns a user object with multiple fields,
	// the output will only include { id: number }.
	.output(
		z.object({
			id: z.number(),
		}),
	)
	.post(async ctx => {
		const { username, password, email } = ctx.input;

		const user = await createUserRecord({ username, password, email });
		//    ^? { id: number, username: string, password: string, email: string }

		return user;
	});
```
