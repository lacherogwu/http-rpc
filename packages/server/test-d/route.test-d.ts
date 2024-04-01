import { expectType } from 'tsd';
import {
	get,
	post,
	singleInput,
	multiInput,
	inferredOutput,
	typedOutputString,
	typedOutputStringArray,
	middlewareOptionalCtx,
	middlewareCtx,
} from '../test/route';
import { Route } from '../src/route';
import type { BaseCtx } from '../src/types';

expectType<'GET'>(get.method);
expectType<'POST'>(post.method);
expectType<{
	id: string;
	role: Map<string, number>;
	date: Date;
	isTrue: boolean;
	hobbies: string[];
	age: number;
	nested: {
		id: string;
		role: Record<string, number>;
		date: Date;
		isTrue: boolean;
		hobbies: string[];
		age: number;
	};
}>(singleInput.input);

expectType<{
	id: string;
	name: string;
	age: number;
}>(multiInput.input);

expectType<{ id: string; name: string; age: number }>(inferredOutput.output);

expectType<string>(typedOutputString.output);
expectType<string[]>(typedOutputStringArray.output);

expectType<
	Route<
		BaseCtx,
		never,
		any,
		| {
				readonly user?: undefined;
		  }
		| { readonly user: { readonly id: 1 } }
	>
>(middlewareOptionalCtx);

expectType<Route<BaseCtx, never, any, { readonly val: 1 }>>(middlewareCtx);
