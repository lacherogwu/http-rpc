import type { Endpoint } from './route';

export type DataTransformer = {
	serialize: (object: any) => any;
	deserialize: (object: any) => any;
};

export type Router = {
	[key: string]: Endpoint | Router;
};

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export type BaseCtx<Req = unknown, Res = unknown> = {
	req: Req;
	res: Res;
};
