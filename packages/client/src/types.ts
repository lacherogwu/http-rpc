import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

type DataTransformer = {
	serialize: (object: any) => any;
	deserialize: (object: any) => any;
};

type HTTPHeaders = Record<string, string[] | string | undefined>;
export type Opts = {
	url: string;
	transformer?: DataTransformer;
	headers?: HTTPHeaders | (() => HTTPHeaders | Promise<HTTPHeaders>);
	onRequest?: (req: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
	onResponse?: (res: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
	onError?: (error: AxiosError) => any;
};

type InferPromise<T> = T extends Promise<infer U> ? U : T;

export type ClientType<T> =
	T extends Record<string, any>
		? {
				[K in keyof T]: T[K] extends {
					method: infer Method;
				}
					? Method extends 'GET'
						? T[K]['input'] extends Record<string, any>
							? {
									get: (input: T[K]['input']) => Promise<InferPromise<T[K]['output']>>;
								}
							: {
									get: () => Promise<InferPromise<T[K]['output']>>;
								}
						: Method extends 'POST'
							? T[K]['input'] extends Record<string, any>
								? {
										post: (input: T[K]['input']) => Promise<InferPromise<T[K]['output']>>;
									}
								: {
										post: () => Promise<InferPromise<T[K]['output']>>;
									}
							: never
					: ClientType<T[K]>;
			}
		: never;
