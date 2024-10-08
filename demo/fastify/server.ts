import { createRoute, RPCError } from '@http-rpc/server';
import { FastifyContext, rpcFastify } from '@http-rpc/server/adapters/fastify';
import Fastify from 'fastify';
import superjson from 'superjson';
import { z } from 'zod';

const fastify = Fastify({
	logger: true,
});

const publicRoute = createRoute<FastifyContext>();

publicRoute.on('afterMiddlewares', ctx => {
	console.log('publicRoute afterMiddleware');
});

const protectedRoute = publicRoute.middleware(ctx => {
	const token = ctx.req.headers.authorization;
	if (!token) {
		throw new RPCError({ code: 'UNAUTHORIZED', title: 'Missing token' });
	}

	return {
		userToken: token,
	};
});

protectedRoute.on('afterMiddlewares', ctx => {
	console.log('protectedRoute afterMiddleware');
});

const router = {
	version: publicRoute.get(() => {
		return { version: '1.0.0' };
	}),
	users: {
		list: protectedRoute.get(ctx => {
			const { userToken } = ctx;

			return {
				users: [
					{ id: 1, name: 'Alice' },
					{ id: 2, name: 'Bob' },
				],
				userToken,
			};
		}),
		create: protectedRoute
			.input(
				z.object({
					name: z.string(),
				}),
			)
			.output(z.object({ id: z.number(), name: z.string() }))
			.post(ctx => {
				const { name } = ctx.input;

				console.log(`creating user ${name}`);

				return {
					id: 1,
					name,
					password: '123456', // will not be returned because of the output schema
				};
			}),
		update: publicRoute.get(() => {
			throw new RPCError({
				code: 'NOT_IMPLEMENTED',
				title: 'Not implemented',
			});
		}),
	},
};

export type Router = typeof router;

fastify.register(rpcFastify, {
	prefix: '/rpc',
	router,
	transformer: superjson,
});

await fastify.listen({ port: 3000, host: '0.0.0.0' });
