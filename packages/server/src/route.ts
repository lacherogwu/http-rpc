import z, { ZodAny, ZodObject, ZodType, ZodOptional } from 'zod';
import type { BaseCtx, Prettify } from './types';

type Ctx<AdapterContext extends BaseCtx, InputSchema = unknown> = {
	req: AdapterContext['req'];
	res: AdapterContext['res'];
	input: InputSchema;
};

type IsNever<T> = [T] extends [never] ? true : false;
type IsAny<T> = 0 extends 1 & T ? true : false;
type FormatInput<T, U> = IsNever<T> extends true ? U : T & U;

type Event = 'afterMiddlewares';
type EventCbCtx<AdapterContext extends BaseCtx, MiddlewareContext = {}> = Pick<Ctx<AdapterContext>, 'req' | 'res'> & MiddlewareContext & Record<string, any>;

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

export class Route<AdapterContext extends BaseCtx, InputSchema = never, OutputSchema = any, MiddlewareContext = {}> {
	#input: ZodObject<any>;
	#output: any;
	#middlewares: ((ctx: Ctx<AdapterContext, InputSchema> & MiddlewareContext) => any)[];
	#afterMiddlewares: ((ctx: Ctx<AdapterContext, InputSchema> & MiddlewareContext) => any)[];

	constructor(data?: any) {
		this.#input = data?.input ?? z.any();
		this.#output = data?.output ?? z.any();
		this.#middlewares = data?.middlewares ?? [];
		this.#afterMiddlewares = data?.afterMiddlewares ?? [];
	}

	#isZodObject(schema?: ZodAny | ZodObject<any>): schema is ZodObject<any> {
		return schema?._def?.typeName === 'ZodObject';
	}

	#isZodAny(schema?: ZodAny | ZodObject<any>): schema is ZodAny {
		return schema?._def?.typeName === 'ZodAny';
	}

	#prepare(data: any) {
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
			afterMiddlewares: this.#afterMiddlewares.slice(),
		});
	}

	input<Schema extends ZodObject<any> | ZodOptional<ZodObject<any>>>(schema: Schema) {
		return this.#prepare({ input: schema }) as unknown as Route<
			AdapterContext,
			Prettify<FormatInput<InputSchema, z.infer<Schema>>>,
			OutputSchema,
			MiddlewareContext
		>;
	}

	output<Schema extends ZodType>(schema: Schema) {
		return this.#prepare({ output: schema }) as unknown as Route<AdapterContext, InputSchema, z.infer<Schema>, MiddlewareContext>;
	}

	middleware<const T extends Record<string, unknown> | void>(middleware: (ctx: Ctx<AdapterContext, InputSchema> & MiddlewareContext) => T | Promise<T>) {
		return this.#prepare({ middleware }) as unknown as Route<AdapterContext, InputSchema, OutputSchema, Prettify<MiddlewareContext & Awaited<T>>>;
	}

	post<T extends OutputSchema>(cb: (ctx: Ctx<AdapterContext, InputSchema> & MiddlewareContext) => T | Promise<T>) {
		return new Endpoint({
			method: 'POST',
			input: this.#input as InputSchema,
			output: this.#output as IsAny<OutputSchema> extends true ? T : OutputSchema,
			handler: cb,
			middlewares: this.#middlewares.concat(this.#afterMiddlewares),
		});
	}

	get<T extends OutputSchema>(cb: (ctx: Ctx<AdapterContext, InputSchema> & MiddlewareContext) => T | Promise<T>) {
		return new Endpoint({
			method: 'GET',
			input: this.#input as InputSchema,
			output: this.#output as IsAny<OutputSchema> extends true ? T : OutputSchema,
			handler: cb,
			middlewares: this.#middlewares.concat(this.#afterMiddlewares),
		});
	}

	on(event: Event, cb: (ctx: EventCbCtx<AdapterContext, MiddlewareContext>) => void | Promise<void>) {
		switch (event) {
			case 'afterMiddlewares':
				this.#afterMiddlewares.push(cb);
				break;
		}
	}
}

export function createRoute<AdapterContext extends BaseCtx>() {
	return new Route<AdapterContext>();
}
