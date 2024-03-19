import type { Router } from './types';
import { createTypeAlias, zodToTs, printNode } from 'zod-to-ts';
import * as changeCase from 'change-case';
import { FixedRoute } from './route';
import { ZodType } from 'zod';

export function generateClientTypes(router: Router) {
	// TODO: use the typescript compiler api to generate the types
	// also will be capable of generating the inferred type of the function instead of using the output value
	// also will be able to pretty print the types

	const routesTypes: string[] = [];
	const routerType: Record<string, any> = {};

	function generateTypes(route: Router | FixedRoute, path: string[] = []) {
		if (route instanceof FixedRoute) {
			const finalPath = path.concat(route.method.toLowerCase());
			const id = finalPath.join('.');
			const typeIdentifier = changeCase.pascalCase(id);
			const inputId = `${typeIdentifier}Input`;
			const outputId = `${typeIdentifier}Output`;

			const inputType = generateTypeAlias(route.input, inputId);
			const outputType = generateTypeAlias(route.output, outputId);

			let curr = routerType;
			for (let i = 0; i < finalPath.length; i++) {
				const k = finalPath[i]!;
				curr[k] = curr[k] || {};
				if (i === finalPath.length - 1) {
					// TODO: when using the typescript compiler api, we can infer the type of the function and then decide if we need to include the input or not
					curr[k] = `(${inputType.endsWith('any;') ? '' : `input: ${inputId}`}) => Promise<${outputId}>`;
				} else {
					curr = curr[k]!;
				}
			}

			routesTypes.push(inputType);
			routesTypes.push(outputType);
		} else {
			for (const k in route) {
				const value = route[k]!;
				generateTypes(value, [...path, k]);
			}
		}
	}

	function generateTypeAlias(zodSchema: ZodType, id: string) {
		const { node } = zodToTs(zodSchema, id);
		const typeAlias = createTypeAlias(node, id);
		return `export ${printNode(typeAlias)}`;
	}

	generateTypes(router);
	const clientType = JSON.stringify(routerType, null, 2).replace(/"/g, '');
	return '/* Types generated automatically by @http-rpc/server */\n\n' + routesTypes.join('\n') + '\n' + `export type Client = ${clientType}`;
}
