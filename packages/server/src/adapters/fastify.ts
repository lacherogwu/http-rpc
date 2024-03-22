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
	const { prefix, transformer = JSON, router } = opts;

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
		const result: Record<string, any> = {
			statusCode: 500,
			code: 'INTERNAL_SERVER_ERROR',
			message: err.message ?? 'Internal Server Error',
		};
		if (err instanceof RequestValidationError) {
			const { statusCode = 400, code, errors } = err;
			Object.assign(result, {
				statusCode,
				code,
				message: 'Bad Request',
				errors,
			});
		} else if (err instanceof RPCError) {
			const { code, message } = err;
			const httpStatusCode = RPC_CODE_TO_HTTP_STATUS_CODE[code] ?? 500;
			Object.assign(result, { statusCode: httpStatusCode, code, message });
		}

		return reply.status(result.statusCode).send(transformer.stringify(result));
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
	details: Record<string, any>;

	constructor(validationResult: Record<string, any>) {
		super("Response doesn't match the schema");
		this.name = 'ResponseValidationError';
		this.details = validationResult.error;
	}
}

const createValidatorCompiler = (transformer: DataTransformer) => {
	const validatorCompiler: FastifySchemaCompiler<ZodAny> = ({ schema, method }) => {
		return data => {
			if (method === 'GET') {
				data = data.input;
			} else if (method === 'POST') {
				data = JSON.stringify(data);
			}
			const json = transformer.parse(data || '{}');
			try {
				return { value: schema.parse(json) };
			} catch (err: any) {
				return { error: new RequestValidationError(err) };
			}
		};
	};

	return validatorCompiler;
};
const createSerializerCompiler = (transformer: DataTransformer) => {
	const serializerCompiler: FastifySerializerCompiler<ZodAny> =
		({ schema }) =>
		data => {
			const result = schema.safeParse(data);

			if (result.success) {
				return transformer.stringify(result.data);
			}
			throw new ResponseValidationError(result);
		};

	return serializerCompiler;
};
