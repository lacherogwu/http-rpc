import axios from 'axios';
import type { Opts, ClientType } from './types';

type ProxyCallbackOpts = {
	path: string[];
	args: unknown[];
};
type ProxyCallback = (opts: ProxyCallbackOpts) => unknown;

function createInnerProxy(callback: ProxyCallback, path: string[] = []): any {
	return new Proxy(() => {}, {
		get(_target, prop: string): any {
			return createInnerProxy(callback, path.concat(prop));
		},
		async apply(_target, _thisArg, args) {
			return await callback({ path, args });
		},
	});
}

export function createClient<T>(opts?: Opts): ClientType<T> {
	const { url, transformer, headers, onRequest, onResponse, onError } = opts ?? {};

	const getHeaders = async () => {
		if (typeof headers === 'function') {
			return headers();
		}
		return headers;
	};

	const inputSerializer = (input: any) => {
		let data = input;
		if (transformer) {
			data = transformer.serialize(data);
		}
		return JSON.stringify(data ?? '{}');
	};

	const instance = axios.create({
		baseURL: url,
		headers: {
			'Content-Type': 'application/json',
		},
		transformRequest: inputSerializer,
		paramsSerializer: input => `input=${inputSerializer(input)}`,
		transformResponse: (responseAsString: string, _headers, status) => {
			if (status !== 200) return JSON.parse(responseAsString);
			const response: { data: any } = JSON.parse(responseAsString);
			let data = response.data;
			if (transformer) {
				data = transformer.deserialize(data);
			}
			return data;
		},
		withCredentials: true,
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

	return createInnerProxy(async ({ path, args }) => {
		// MAYBE: accept extra options in second arg, like headers, etc.
		const [input] = args;
		const method = path.at(-1);
		const urlPath = path.slice(0, -1).join('/');

		if (method === 'sse') {
			const reqUrl = `${url}/${urlPath}`;
			const finalUrl = input ? `${reqUrl}?input=${inputSerializer(input)}` : reqUrl;
			const sse = new EventSource(finalUrl, { withCredentials: true });

			const dataQueue: any[] = [];
			let resolve: ((value: any) => void) | null = null;

			sse.onmessage = event => {
				const response: { data: any } = JSON.parse(event.data);
				let data = response.data;
				if (transformer) {
					data = transformer.deserialize(data);
				}
				if (resolve) {
					resolve(data);
					resolve = null;
				} else {
					dataQueue.push(data);
				}
			};

			const iterator = async function* () {
				while (true) {
					if (dataQueue.length > 0) {
						yield dataQueue.shift();
					} else {
						yield await new Promise(res => {
							resolve = res;
						});
					}
				}
			};

			return iterator();
		}

		const request: Record<string, any> = {
			method,
			headers: await getHeaders(),
			url: `/${urlPath}`,
		};

		if (method === 'get') {
			request.params = input;
		} else if (method === 'post') {
			request.data = input;
		}

		return instance(request);
	});
}
