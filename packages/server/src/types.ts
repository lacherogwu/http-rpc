import type { FixedRoute } from './route';

export type DataTransformer = {
	parse: (object: any) => any;
	stringify: (object: any) => any;
};

export type Router = {
	[key: string]: FixedRoute | Router;
};

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
