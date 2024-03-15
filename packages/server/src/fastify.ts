import fp from 'fastify-plugin';
import { createValidatorCompiler, createSerializerCompiler, RequestValidationError } from './helpers';
import { FixedRoute } from './route';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { DataTransformer } from './types';

type Router = {
	[key: string]: FixedRoute | Router;
};

type FastifyPluginOptions = {
	router: Router;
	prefix?: string;
	transformer?: DataTransformer;
};

export const fastifyRPCPlugin = fp<FastifyPluginOptions>((fastify, opts, done) => {
	fastify.setValidatorCompiler(createValidatorCompiler(opts.transformer));
	fastify.setSerializerCompiler(createSerializerCompiler(opts.transformer));

	const { prefix } = opts;

	fastify.route({
		method: 'GET',
		url: `${prefix}/version`,
		handler: async (request, reply) => {
			return { version: '1.0.0' };
		},
	});

	function registerRoutes(key: string = '', route: Router | FixedRoute) {
		if (route instanceof FixedRoute) {
			const schema = {};
			Object.assign(schema, {
				response: {
					200: route.output,
				},
			});

			if (route.method === 'GET') {
				Object.assign(schema, {
					querystring: route.input,
				});
			} else if (route.method === 'POST') {
				Object.assign(schema, {
					body: route.input,
				});
			}

			const handler = async (request: FastifyRequest, reply: FastifyReply) => {
				return route.handler({
					request,
					reply,
					userId: 1,
					input: request.body ?? request.query,
				});
			};

			fastify.route({
				method: route.method,
				url: `${prefix}${key}`,
				// preHandler: route.middlewares ?? [],
				handler: handler,
				schema,
			});
		} else {
			for (const k in route) {
				const value = route[k]!;
				registerRoutes(`${key}/${k}`, value);
			}
		}
	}
	registerRoutes('', opts.router);

	fastify.setErrorHandler((err, request, reply) => {
		if (err instanceof RequestValidationError) {
			const { statusCode = 400, code, errors } = err;
			return reply.status(statusCode).send({
				statusCode,
				code,
				error: 'Bad Request',
				errors,
			});
		}

		return reply.send(err);
	});

	done();
});
