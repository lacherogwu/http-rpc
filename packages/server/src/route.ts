import type { FastifyRequest, FastifyReply } from 'fastify';
import z, { ZodType, ZodObject, ZodAny, ZodUnknown } from 'zod';
import { Prettify } from './types';

// TODO: remove fastify dependency
// change to req & res, and provide to Route<FastifyRequest, FastifyReply> and Ctx<FastifyRequest, FastifyReply> generics

type Ctx<InputSchema = unknown> = {
	req: FastifyRequest;
	res: FastifyReply;
	input: InputSchema;
};

export class Endpoint<
	Input extends {
		method: 'GET' | 'POST';
		input?: any;
		output: any;
		handler: (ctx: any) => any;
		middlewares: ((ctx: any) => Record<keyof any, unknown> | void)[];
	} = any,
> {
	method: Input['method'];
	input: Input['input'];
	output: Input['output'];
	handler: Input['handler'];
	middlewares: Input['middlewares'];

	constructor(input: Input) {
		this.method = input.method;
		this.input = input?.input;
		this.output = input.output;
		this.handler =
			input.handler ??
			(() => {
				throw new Error('Handler not implemented');
			});
		this.middlewares = input.middlewares;
	}
}

export class Route<InputSchema = unknown, OutputSchema extends ZodType = any, MiddlewareContext = {}> {
	#input: ZodObject<any>;
	#output: ZodType;
	#middlewares: ((ctx: Ctx<InputSchema> & MiddlewareContext) => any)[];

	constructor(data?: any) {
		this.#input = data?.input ?? z.unknown();
		this.#output = data?.output ?? z.any();
		this.#middlewares = data?.middlewares ?? [];
	}

	#isZodObject(schema?: ZodAny | ZodObject<any>): schema is ZodObject<any> {
		return schema?._def?.typeName === 'ZodObject';
	}

	#isZodUnknown(schema?: ZodAny | ZodObject<any> | ZodUnknown): schema is ZodUnknown {
		return schema?._def?.typeName === 'ZodUnknown';
	}

	#prepare(data: any) {
		let input = this.#input;
		if (this.#isZodUnknown(input)) {
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
		return this.#prepare({ input: schema }) as unknown as Route<Prettify<InputSchema & z.infer<Schema>>, OutputSchema, MiddlewareContext>;
	}

	output<Schema extends ZodType>(schema: Schema) {
		return this.#prepare({ output: schema }) as unknown as Route<InputSchema, z.infer<Schema>, MiddlewareContext>;
	}

	middleware<const T extends Record<string, any> | void>(middleware: (ctx: Ctx<InputSchema> & MiddlewareContext) => T) {
		return this.#prepare({ middleware }) as unknown as Route<InputSchema, OutputSchema, Prettify<MiddlewareContext & Awaited<T>>>;
	}

	post<T extends OutputSchema | Promise<OutputSchema>>(cb: (ctx: Ctx<InputSchema> & MiddlewareContext) => T) {
		return new Endpoint({
			method: 'POST',
			input: this.#input as InputSchema,
			output: this.#output as T,
			handler: cb,
			middlewares: this.#middlewares,
		});
	}

	get<T extends OutputSchema | Promise<OutputSchema>>(cb: (ctx: Ctx<InputSchema> & MiddlewareContext) => T) {
		return new Endpoint({
			method: 'GET',
			input: this.#input as InputSchema,
			output: this.#output as T,
			handler: cb,
			middlewares: this.#middlewares,
		});
	}
}
