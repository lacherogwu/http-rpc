import type { Router } from './types';
import { createTypeAlias, zodToTs, printNode } from 'zod-to-ts';
import * as changeCase from 'change-case';
import { FixedRoute } from './route';
import { ZodType } from 'zod';

export async function generateClientTypes(router: Router) {
	// console.log(router);

	async function generateTypes(route: Router | FixedRoute, path: string[] = []) {
		if (route instanceof FixedRoute) {
			const id = path.join('.');
			const typeIdentifier = changeCase.pascalCase(id);
			const inputId = `${typeIdentifier}Input`;
			const outputId = `${typeIdentifier}Output`;

			const inputType = generateTypeAlias(route.input, inputId);
			const outputType = generateTypeAlias(route.output, outputId);

			console.log(inputType);
			console.log(outputType);
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

	const types = generateTypes(router);
	//   const types = generateTypes(router);
}

// const id = 'auth.users.listOutput';
// // pass schema and name of type/identifier
// const identifier = changeCase.pascalCase(id);
// const { node } = zodToTs(UserSchema, identifier);
// const typeAlias = createTypeAlias(
// 	node,
// 	identifier,
// 	// optionally pass a comment
// 	// comment: UserSchema.description
// );
// console.log(`export ${printNode(typeAlias)}`);
