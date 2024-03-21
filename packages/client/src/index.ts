import axios from 'axios';
import type { Opts, ClientType } from './types';

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
		transformResponse: data => {
			if (data === '' || data === undefined) return;
			return transformer.parse(data ?? '');
		},
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
