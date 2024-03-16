import type { FastifyRequest, FastifyReply } from 'fastify';
import z, { ZodType, ZodObject, ZodAny } from 'zod';

type ZodInfer<T> = T extends ZodType ? z.infer<T> : never;

// TODO: remove fastify dependency
// change to req & res, and provide to Route<FastifyRequest, FastifyReply> and Ctx<FastifyRequest, FastifyReply> generics

type Ctx<InputSchema extends ZodType | unknown = unknown> = {
	request: FastifyRequest;
	reply: FastifyReply;
	input: ZodInfer<InputSchema>;
};

export class FixedRoute<Ctx = any, T = any> {
	method: 'POST' | 'GET';
	handler: (ctx: Ctx) => T;
	middlewares: any[];
	input: ZodObject<any> | ZodAny;
	output: ZodType;

	constructor(data: FixedRoute<Ctx, T>) {
		this.method = data.method;
		this.handler = data.handler;
		this.middlewares = data.middlewares;
		this.input = data.input;
		this.output = data.output;
	}
}

export class Route<InputSchema extends ZodType | unknown = unknown, OutputSchema extends ZodType = any, MiddlewareContext = {}> {
	#method: 'POST' | 'GET' | null;
	#handler: (ctx: Ctx<InputSchema> & MiddlewareContext) => unknown;
	#input: ZodObject<any> | ZodAny;
	#output: ZodType;
	#middlewares: ((ctx: Ctx<InputSchema> & MiddlewareContext) => any)[];

	constructor(data?: any) {
		this.#input = data?.input ?? z.any();
		this.#output = data?.output ?? z.any();
		this.#method = data?.method ?? null;
		this.#handler =
			data?.handler ??
			(() => {
				throw new Error('Handler not implemented');
			});
		this.#middlewares = data?.middlewares ?? [];
	}

	#isZodObject(schema?: ZodAny | ZodObject<any>): schema is ZodObject<any> {
		return schema?._def?.typeName === 'ZodObject';
	}

	#isZodAny(schema?: ZodAny | ZodObject<any>): schema is ZodAny {
		return schema?._def?.typeName === 'ZodAny';
	}

	#create(data: any) {
		let input = this.#input;
		if (this.#isZodAny(input)) {
			input = data.input;
		} else if (this.#isZodObject(input) && this.#isZodObject(data.input)) {
			input = input.merge(data.input);
		}
		const output = data.output ?? this.#output;

		return new Route({
			input,
			output,
			method: data.method,
			handler: data.handler,
			middlewares: this.#middlewares.concat(data.middleware).filter(Boolean),
		});
	}

	input<Schema extends ZodObject<any>>(schema: Schema) {
		return this.#create({ input: schema }) as unknown as Route<InputSchema & Schema, OutputSchema, MiddlewareContext>;
	}

	output<Schema extends ZodType>(schema: Schema) {
		return this.#create({ output: schema }) as unknown as Route<InputSchema, Schema, MiddlewareContext>;
	}

	middleware<const T extends Record<string, any> | void>(middleware: (ctx: Ctx<InputSchema> & MiddlewareContext) => T) {
		return this.#create({ middleware }) as unknown as Route<InputSchema, OutputSchema, MiddlewareContext & Awaited<T>>;
	}

	post<T extends z.infer<OutputSchema> | Promise<z.infer<OutputSchema>>>(cb: (ctx: Ctx<InputSchema> & MiddlewareContext) => T) {
		const route = this.#create({
			method: 'POST',
			handler: cb,
		});
		return route.#fixed<T>();
	}

	get<T extends z.infer<OutputSchema> | Promise<z.infer<OutputSchema>>>(cb: (ctx: Ctx<InputSchema> & MiddlewareContext) => T) {
		const route = this.#create({
			method: 'GET',
			handler: cb,
		});
		return route.#fixed<T>();
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
