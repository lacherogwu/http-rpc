import axios from 'axios';
import type { Opts, ClientType } from './types';

export function createClient<T>(opts?: Opts): ClientType<T> {
	const { url, transformer, headers, onRequest, onResponse, onError } = opts ?? {};

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
		transformRequest: input => {
			let data = input;
			if (transformer) {
				data = transformer.serialize(data);
			}
			return JSON.stringify(data ?? '{}');
		},
		paramsSerializer: input => {
			let data = input;
			if (transformer) {
				data = transformer.serialize(data);
			}
			return `input=${JSON.stringify(data)}`;
		},
		transformResponse: (responseAsString: string, _headers, status) => {
			if (status !== 200) return JSON.parse(responseAsString);
			const response: { data: any } = JSON.parse(responseAsString);
			let data = response.data;
			if (transformer) {
				data = transformer.deserialize(data);
			}
			return data;
		},
	});

	instance.interceptors.request.use(onRequest);
	instance.interceptors.response.use(onResponse, async err => {
		if (onError) {
			const error = await onError(err);
			return Promise.reject(error);
		}
		return Promise.reject(err);
	});
	instance.interceptors.response.use(res => res.data);

	const handler = {
		get(target: any, prop: string): any {
			return new Proxy(() => target().concat(prop), handler);
		},
		async apply(target: any, _thisArg: any, args: any[]) {
			const path = target();
			const [input] = args;
			const method = path.pop();
			const urlPath = path.join('/');

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
	return new Proxy(() => [], handler);
}
