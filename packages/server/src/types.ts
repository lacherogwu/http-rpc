export type DataTransformer = {
	parse: (object: any) => any;
	stringify: (object: any) => any;
};
