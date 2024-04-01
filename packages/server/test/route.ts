import { createRoute } from '../src/index';
import { z } from 'zod';

const publicRoute = createRoute();

export const get = publicRoute.get(() => {});
export const post = publicRoute.post(() => {});

export const singleInput = publicRoute
	.input(
		z.object({
			id: z.string(),
			role: z.map(z.string(), z.number()),
			date: z.date(),
			isTrue: z.boolean(),
			hobbies: z.array(z.string()),
			age: z.number(),
			nested: z.object({
				id: z.string(),
				role: z.record(z.string(), z.number()),
				date: z.date(),
				isTrue: z.boolean(),
				hobbies: z.array(z.string()),
				age: z.number(),
			}),
		}),
	)
	.get(() => {});

export const multiInput = publicRoute
	.input(
		z.object({
			id: z.string(),
		}),
	)
	.input(
		z.object({
			name: z.string(),
		}),
	)
	.input(
		z.object({
			age: z.number(),
		}),
	)
	.get(() => {});

export const inferredOutput = publicRoute.get(() => {
	return {
		id: '1',
		name: 'Alice',
		age: 20,
	};
});

// @ts-expect-error
export const typedOutputString = publicRoute.output(z.string()).get(() => {});

// @ts-expect-error
export const typedOutputStringArray = publicRoute.output(z.array(z.string())).get(() => {});

export const middlewareOptionalCtx = publicRoute.middleware(() => {
	if (Math.random() > 0.5) return;

	return {
		user: {
			id: 1,
		},
	};
});

export const middlewareCtx = publicRoute.middleware(() => {
	return {
		val: 1,
	};
});
