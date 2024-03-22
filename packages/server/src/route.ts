import z, { ZodAny, ZodArray, ZodObject, ZodUnknown } from 'zod';
import type { BaseCtx, Prettify } from './types';

type Ctx<AdapterContext extends BaseCtx, InputSchema = unknown> = {
	req: AdapterContext['req'];
	res: AdapterContext['res'];
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

export class Route<
	AdapterContext extends BaseCtx,
	InputSchema = unknown,
	OutputSchema extends Record<string, unknown> | any[] | void = Record<string, unknown> | any[] | void,
	MiddlewareContext = {},
> {
	#input: ZodObject<any>;
	#output: any;
	#middlewares: ((ctx: Ctx<AdapterContext, InputSchema> & MiddlewareContext) => any)[];

	constructor(data?: any) {
		this.#input = data?.input ?? z.unknown();
		this.#output = data?.output ?? z.union([z.record(z.string(), z.unknown()), z.array(z.unknown()), z.void()]);
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
		return this.#prepare({ input: schema }) as unknown as Route<AdapterContext, Prettify<InputSchema & z.infer<Schema>>, OutputSchema, MiddlewareContext>;
	}

	output<Schema extends ZodObject<any> | ZodArray<any>>(schema: Schema) {
		return this.#prepare({ output: schema }) as unknown as Route<AdapterContext, InputSchema, z.infer<Schema>, MiddlewareContext>;
	}

	middleware<const T extends Record<string, any> | void>(middleware: (ctx: Ctx<AdapterContext, InputSchema> & MiddlewareContext) => T) {
		return this.#prepare({ middleware }) as unknown as Route<AdapterContext, InputSchema, OutputSchema, Prettify<MiddlewareContext & Awaited<T>>>;
	}

	post<T extends OutputSchema>(cb: (ctx: Ctx<AdapterContext, InputSchema> & MiddlewareContext) => T | Promise<T>) {
		return new Endpoint({
			method: 'POST',
			input: this.#input as InputSchema,
			output: this.#output as T,
			handler: cb,
			middlewares: this.#middlewares,
		});
	}

	get<T extends OutputSchema>(cb: (ctx: Ctx<AdapterContext, InputSchema> & MiddlewareContext) => T | Promise<T>) {
		return new Endpoint({
			method: 'GET',
			input: this.#input as InputSchema,
			output: this.#output as T,
			handler: cb,
			middlewares: this.#middlewares,
		});
	}
}

export function createRoute<AdapterContext extends BaseCtx>() {
	return new Route<AdapterContext>();
}
