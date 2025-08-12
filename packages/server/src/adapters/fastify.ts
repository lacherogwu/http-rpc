import fp from 'fastify-plugin';
import { Endpoint } from '../route';
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest, FastifySchemaCompiler } from 'fastify';
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
	onError?: (result: Record<string, any>, err: Error) => any;
};

export type FastifyContext = BaseCtx<FastifyRequest, FastifyReply>;
export const rpcFastify = fp<FastifyPluginOptions>((fastify: FastifyInstance, opts: FastifyPluginOptions, done: (error?: FastifyError) => void) => {
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

			const isSSE = route.method === 'SSE';
			if (isSSE) {
				route.method = 'GET';
			}

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
				if (isSSE) {
					const iterator = route.handler(ctx);

					res.raw.writeHead(200, {
						...(res.getHeaders() as Record<string, string>),
						'Content-Type': 'text/event-stream',
						'Cache-Control': 'no-cache',
						Connection: 'keep-alive',
					});

					const sendEvent = (data: any) => {
						res.raw.write(`data: ${JSON.stringify(data)}\n\n`);
					};

					(async () => {
						for await (const data of iterator) {
							let output = data;
							if (transformer) {
								output = transformer.serialize(output);
							}
							sendEvent({ data: output });
						}
					})();

					return res;
				}

				const data = await route.handler(ctx);
				if (res.sent) return;

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

	fastify.setErrorHandler(async (err, req, res) => {
		res.header('Content-Type', 'application/problem+json');
		let result = {
			status: 500,
			title: err.message ?? 'Internal Server Error',
			code: 'INTERNAL_SERVER_ERROR',
			instance: req.routeOptions.url,
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

		const onErrResult = async () => {
			try {
				return await opts.onError?.(result, err);
			} catch (err) {
				console.error(err);
			}
		};

		// @ts-ignore
		result = (await onErrResult()) ?? result;

		return res.status(result.status ?? 500).send(JSON.stringify(result));
	});

	done();
});

class RequestValidationError extends Error {
	errors: ZodError['issues'];
	constructor(err: ZodError) {
		super("Request doesn't match the schema");
		this.name = 'RequestValidationError';
		this.errors = err.issues;
	}
}

class ResponseValidationError extends Error {
	errors: ZodError['issues'];

	constructor(error: ZodError) {
		super("Response doesn't match the schema");
		this.name = 'ResponseValidationError';
		this.errors = error.issues;
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
