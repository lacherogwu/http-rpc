import type { Endpoint } from './route';

export type DataTransformer = {
	parse: (object: any) => any;
	stringify: (object: any) => any;
};

export type Router = {
	[key: string]: Endpoint | Router;
};

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
