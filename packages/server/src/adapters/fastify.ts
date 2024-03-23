import fp from 'fastify-plugin';
import { Endpoint } from '../route';
import type { FastifyReply, FastifyRequest, FastifySchemaCompiler } from 'fastify';
import type { FastifySerializerCompiler } from 'fastify/types/schema';
import type { ZodAny, ZodError } from 'zod';
import type { Router, DataTransformer, BaseCtx } from '../types';
import { RPCError, RPC_CODE_TO_HTTP_STATUS_CODE } from '../error';

type FastifyRequestWithCtx = FastifyRequest & {
	_httpRpcCtx: Record<string, any>;
};

type FastifyPluginOptions = {
	router: Router;
	prefix?: string;
	transformer?: DataTransformer;
};

export type FastifyContext = BaseCtx<FastifyRequest, FastifyReply>;

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

			function attachCtx(req: FastifyRequestWithCtx, res: FastifyReply) {
				if (!req._httpRpcCtx) req._httpRpcCtx = { req, res, input: req.body ?? req.query };
				return req._httpRpcCtx;
			}

			const handler = async (req: FastifyRequestWithCtx, res: FastifyReply) => {
				const ctx = attachCtx(req, res);
				const data = await route.handler(ctx);
				return { data };
			};

			const preHandlerWrapper = (cb: any) => {
				return async (req: FastifyRequestWithCtx, res: FastifyReply) => {
					const ctx = attachCtx(req, res);
					const result = await cb(ctx);
					Object.assign(ctx, result);
				};
			};

			fastify.route({
				method: route.method,
				url: `${prefix}${key}`,
				// @ts-ignore
				preHandler: route.middlewares.map(preHandlerWrapper),
				// @ts-ignore
				handler,
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

	fastify.setErrorHandler((err, req, reply) => {
		reply.header('Content-Type', 'application/problem+json');
		const result = {
			status: 500,
			title: err.message ?? 'Internal Server Error',
			code: 'INTERNAL_SERVER_ERROR',
			instance: req.url,
		} satisfies Record<string, any>;

		if (err instanceof RequestValidationError) {
			const { statusCode = 400, code, errors } = err;
			Object.assign(result, {
				status: statusCode,
				title: 'Bad Request',
				detail: 'Request validation failed',
				code,
				errors,
			});
		} else if (err instanceof RPCError) {
			const { type, title, detail, code, extensions } = err;
			const httpStatusCode = RPC_CODE_TO_HTTP_STATUS_CODE[code] ?? 500;
			Object.assign(result, {
				status: httpStatusCode,
				type,
				title,
				detail,
				code,
			});
			Object.assign(result, extensions);
		}

		return reply.status(result.status).send(JSON.stringify(result));
	});

	done();
});

class RequestValidationError extends Error {
	errors: ZodError['errors'];
	constructor(err: ZodError) {
		super("Request doesn't match the schema");
		this.name = 'RequestValidationError';
		this.errors = err.errors;
	}
}

class ResponseValidationError extends Error {
	errors: ZodError['errors'];

	constructor(error: ZodError) {
		super("Response doesn't match the schema");
		this.name = 'ResponseValidationError';
		this.errors = error.errors;
	}
}

const createValidatorCompiler = (transformer?: DataTransformer) => {
	const validatorCompiler: FastifySchemaCompiler<ZodAny> = ({ schema, method }) => {
		return data => {
			if (method === 'GET') {
				data = JSON.parse(data.input ?? '{}');
			}

			if (transformer) {
				data = transformer.deserialize(data);
			}

			try {
				return { value: schema.parse(data) };
			} catch (err: any) {
				return { error: new RequestValidationError(err) };
			}
		};
	};

	return validatorCompiler;
};
const createSerializerCompiler = (transformer?: DataTransformer) => {
	const serializerCompiler: FastifySerializerCompiler<ZodAny> =
		({ schema }) =>
		({ data }) => {
			const parsedResult = schema.safeParse(data);

			if (parsedResult.success) {
				let output = parsedResult.data;
				if (transformer) {
					output = transformer.serialize(output);
				}
				return JSON.stringify({ data: output });
			}

			throw new ResponseValidationError(parsedResult.error);
		};

	return serializerCompiler;
};
