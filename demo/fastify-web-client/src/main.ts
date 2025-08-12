import './style.css';
import typescriptLogo from './typescript.svg';
import viteLogo from '/vite.svg';
import { setupCounter } from './counter.ts';

import { createClient } from '@http-rpc/client';
import superjson from 'superjson';
import type { Router } from '../../fastify/server.ts';

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
		console.log(err);
		return err;
	},
});

const versionData = await client.version.get();
console.log(versionData);
// versionData is { version: '1.0.0' }

const users = await client.users.list.get();
console.log('🚀 → users:', users);

const user = await client.users.create.post({ name: 'Charlie' });
console.log('🚀 → user:', user);

const xx = await client.events.special.sse({ cool: false });
(async () => {
	for await (const item of xx) {
		console.log({ item });
	}
})();

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`;

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);
