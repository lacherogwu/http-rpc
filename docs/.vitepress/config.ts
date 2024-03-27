import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: '@http-rpc',
	description: 'Unify Frontend-Backend Interactions',
	head: [['link', { href: '/http-rpc/logo.png', rel: 'icon', type: 'image/png' }]],
	base: '/http-rpc/',
	cleanUrls: true,
	themeConfig: {
		logo: '/logo.png',
		search: {
			provider: 'local',
		},
		editLink: {
			pattern: 'https://github.com/lacherogwu/http-rpc/edit/main/docs/:path',
			text: 'Edit this page on GitHub',
		},
		nav: [
			{
				text: 'Guide',
				link: '/introduction',
			},
		],
		outline: 'deep',
		sidebar: [
			{
				text: 'Getting started',
				items: [
					{
						link: '/introduction',
						text: 'Introduction',
					},
					{
						link: '/concepts',
						text: 'Concepts',
					},
					{
						link: '/demo',
						text: 'Demo',
					},
				],
			},
			{
				text: 'Server Usage',
				items: [
					{
						link: '/server-usage/setup',
						text: 'Setup',
					},
					{
						link: '/server-usage/routes',
						text: 'Define Routes',
					},
					{
						link: '/server-usage/endpoints',
						text: 'Define Endpoints',
					},
					{
						link: '/server-usage/middlewares',
						text: 'Middlewares',
					},
					{
						link: '/server-usage/input-output-validation',
						text: 'Input/Output Validation',
					},
					{
						link: '/server-usage/errors',
						text: 'Errors',
					},
					{
						link: '/server-usage/best-practice',
						text: 'Best Practice',
					},
				],
			},
			{
				text: 'Client Usage',
				items: [
					{
						link: '/client-usage/setup',
						text: 'Setup',
					},
					{
						link: '/client-usage/create-client',
						text: 'Create Client',
					},
					{
						link: '/client-usage/best-practice',
						text: 'Best Practice',
					},
				],
			},
		],
		socialLinks: [
			{
				icon: 'github',
				link: 'https://github.com/lacherogwu/http-rpc',
			},
			{
				icon: 'npm',
				link: 'https://www.npmjs.com/search?q=%40http-rpc',
			},
		],
		footer: {
			copyright: 'Copyright © 2024-present',
			message: 'Released under the MIT License.',
		},
	},
});
