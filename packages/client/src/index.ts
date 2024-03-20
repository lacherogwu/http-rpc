import axios from 'axios';
import type { DataTransformer } from './types';

type HTTPHeaders = Record<string, string>;
type Opts = {
	url: string;
	transformer?: DataTransformer;
	headers?: HTTPHeaders | (() => HTTPHeaders | Promise<HTTPHeaders>);
};

type InferPromise<T> = T extends Promise<infer U> ? U : T;

type ClientType<T> = T extends Record<string, any>
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

export function createClient<T>(opts?: Opts): ClientType<T> {
	const { url, transformer = JSON, headers } = opts ?? {};

	const getHeaders = async () => {
		if (typeof headers === 'function') {
			return headers();
		}
		return headers;
	};

	const instance = axios.create({
		baseURL: url,
		headers: {
			'Content-Type': 'application/json',
		},
		transformRequest: data => transformer.stringify(data),
		paramsSerializer: params => `input=${transformer.stringify(params)}`,
		transformResponse: data => transformer.parse(data),
	});

	instance.interceptors.response.use(res => res.data);

	let path: string[] = [];
	const handler = {
		get(_target: any, prop: string): any {
			path.push(prop);
			return new Proxy(() => {}, handler);
		},
		async apply(_target: any, _thisArg: any, args: any[]) {
			const [input] = args;
			const method = path.pop();
			const urlPath = path.join('/');
			path = [];

			const request: Record<string, any> = {
				method,
				url: `/${urlPath}`,
				headers: await getHeaders(),
			};

			if (method === 'get') {
				request.params = input;
			} else if (method === 'post') {
				request.data = input;
			}

			return instance(request);
		},
	};
	return new Proxy(() => {}, handler);
}
