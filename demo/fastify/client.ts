import { createClient } from '@http-rpc/client';
import superjson from 'superjson';
import type { Router } from './server';

const client = createClient<Router>({
	url: 'http://localhost:3000/rpc',
	transformer: superjson,
	async headers() {
		return {
			Authorization: 'Bearer token',
		};
	},
	onRequest(req) {
		console.log(`${req.method?.toUpperCase() ?? 'Unknown'} ${req.url}`);
		return req;
	},
	onResponse(res) {
		console.log(`${res.status} ${res.statusText}`);
		return res;
	},
	onError(err) {
		return err;
	},
});

// const versionData = await client.version.get();
// console.log(versionData);
// // versionData is { version: '1.0.0' }

// const users = await client.users.list.get();
// console.log('🚀 → users:', users);

// const user = await client.users.create.post({ name: 'Charlie' });
// console.log('🚀 → user:', user);

try {
	const data = await client.users.update.get();
	console.log({ data });
} catch (err: any) {
	console.log('here');
	console.log(JSON.stringify(err.response.data, null, 2));
}
