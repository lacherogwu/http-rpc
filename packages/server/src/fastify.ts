import fp from 'fastify-plugin';
import { createValidatorCompiler, createSerializerCompiler, RequestValidationError } from './helpers';
import { Endpoint } from './route';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Router, DataTransformer } from './types';

type FastifyRequestWithCtx = FastifyRequest & {
	_httpRpcCtx: Record<string, any>;
};

type FastifyPluginOptions = {
	router: Router;
	prefix?: string;
	transformer?: DataTransformer;
};

export const fastifyRPCPlugin = fp<FastifyPluginOptions>((fastify, opts, done) => {
	const { prefix, transformer, router } = opts;

	fastify.setValidatorCompiler(createValidatorCompiler(transformer));
	fastify.setSerializerCompiler(createSerializerCompiler(transformer));

	function registerRoutes(key: string = '', route: Router | Endpoint) {
		if (route instanceof Endpoint) {
			const schema = {
				response: {
					200: route.output,
				},
			};

			if (route.method === 'GET') {
				Object.assign(schema, {
					querystring: route.input,
				});
			} else if (route.method === 'POST') {
				Object.assign(schema, {
					body: route.input,
				});
			}

			const handler = async (request: FastifyRequestWithCtx) => {
				return route.handler(request._httpRpcCtx);
			};

			const preHandlerWrapper = (cb: any) => {
				return async (req: FastifyRequestWithCtx, res: FastifyReply) => {
					if (!req._httpRpcCtx) req._httpRpcCtx = { req, res, input: req.body ?? req.query };
					const result = await cb(req._httpRpcCtx);
					Object.assign(req._httpRpcCtx, result);
				};
			};

			fastify.route({
				method: route.method,
				url: `${prefix}${key}`,
				// @ts-ignore
				preHandler: route.middlewares.map(preHandlerWrapper),
				// @ts-ignore
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
	registerRoutes('', router);

	fastify.setErrorHandler((err, _request, reply) => {
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
