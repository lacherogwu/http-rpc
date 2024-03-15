import type { FastifySchemaCompiler } from 'fastify';
import type { FastifySerializerCompiler } from 'fastify/types/schema';
import superjson from 'superjson';
import type { ZodAny, ZodError } from 'zod';

export class RequestValidationError extends Error {
	errors: ZodError['errors'];
	constructor(err: ZodError) {
		super("Request doesn't match the schema");
		this.name = 'RequestValidationError';
		this.errors = err.errors;
	}
}

export class ResponseValidationError extends Error {
	details: Record<string, any>;

	constructor(validationResult: Record<string, any>) {
		super("Response doesn't match the schema");
		this.name = 'ResponseValidationError';
		this.details = validationResult.error;
	}
}

export const validatorCompiler: FastifySchemaCompiler<ZodAny> = ({ schema, method }) => {
	return data => {
		if (method === 'GET') {
			data = data.input || '{}';
		} else if (method === 'POST') {
			data = JSON.stringify(data);
		}
		const json = superjson.parse(data);
		try {
			return { value: schema.parse(json) };
		} catch (err: any) {
			return { error: new RequestValidationError(err) };
		}
	};
};

export const serializerCompiler: FastifySerializerCompiler<ZodAny> =
	({ schema }) =>
	data => {
		const result = schema.safeParse(data);
		if (result.success) {
			return superjson.stringify(result.data);
		}
		throw new ResponseValidationError(result);
	};
