import type { FastifyReply, FastifyRequest } from 'fastify';
import z, { ZodType } from 'zod';

type Ctx<InputSchema extends ZodType = never> = {
	request: FastifyRequest;
	reply: FastifyReply;
	userId: number;
	input: z.infer<InputSchema>;
};

export class FixedRoute<Ctx = any, T = any> {
	method: 'POST' | 'GET';
	handler: (ctx: Ctx) => T;
	middlewares: any[];
	input: ZodType | undefined;
	output: ZodType | undefined;

	constructor(input: FixedRoute<Ctx, T>) {
		this.method = input.method;
		this.handler = input.handler;
		this.middlewares = input.middlewares;
		this.input = input.input;
		this.output = input.output;
	}
}

export class Route<InputSchema extends ZodType = never, OutputSchema extends ZodType = any, MiddlewareContext = {}> {
	#method: 'POST' | 'GET' | null = null;
	#handler: (ctx: Ctx<InputSchema> & MiddlewareContext) => unknown = () => {
		throw new Error('Handler not implemented');
	};
	#input: ZodType | undefined;
	#output: ZodType | undefined;
	#middlewares: any[] = [];
	#middlewareCalled = false;

	input<Schema extends ZodType>(schema: Schema) {
		this.#input = schema;
		return this as unknown as Route<Schema, OutputSchema, MiddlewareContext>;
	}

	output<Schema extends ZodType>(schema: Schema) {
		this.#output = schema;
		return this as unknown as Route<InputSchema, Schema, MiddlewareContext>;
	}

	middleware<const T extends Record<string, any> | void>(middleware: (ctx: Ctx<InputSchema>) => T) {
		if (this.#middlewareCalled) throw new Error('Middleware can only be called once');
		this.#middlewareCalled = true;

		// TODO: implement multiple middlewares
		// if (Array.isArray(middleware)) {
		// 	this.#middlewares.push(...middleware);
		// } else {
		// 	this.#middlewares.push(middleware);
		// }

		this.#middlewares.push(middleware);
		return this as unknown as Route<InputSchema, OutputSchema, T>;
	}

	post<T extends z.infer<OutputSchema> | Promise<z.infer<OutputSchema>>>(cb: (ctx: Ctx<InputSchema> & MiddlewareContext) => T) {
		this.#method = 'POST';
		this.#handler = cb;
		return this.#fixed<T>();
	}

	get<T extends z.infer<OutputSchema> | Promise<z.infer<OutputSchema>>>(cb: (ctx: Ctx<InputSchema> & MiddlewareContext) => T) {
		this.#method = 'GET';
		this.#handler = cb;

		return this.#fixed<T>();
	}

	#fixed<T = unknown>() {
		return new FixedRoute<Ctx<InputSchema> & MiddlewareContext, T>({
			method: this.#method as 'POST' | 'GET',
			handler: this.#handler as (ctx: Ctx<InputSchema> & MiddlewareContext) => T,
			middlewares: this.#middlewares,
			input: this.#input,
			output: this.#output,
		});
	}
}
