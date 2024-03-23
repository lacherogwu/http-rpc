export const RPC_CODE_TO_HTTP_STATUS_CODE = {
	PARSE_ERROR: 400,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	NOT_FOUND: 404,
	FORBIDDEN: 403,
	METHOD_NOT_SUPPORTED: 405,
	TIMEOUT: 408,
	CONFLICT: 409,
	PRECONDITION_FAILED: 412,
	PAYLOAD_TOO_LARGE: 413,
	UNSUPPORTED_MEDIA_TYPE: 415,
	UNPROCESSABLE_CONTENT: 422,
	TOO_MANY_REQUESTS: 429,
	CLIENT_CLOSED_REQUEST: 499,
	INTERNAL_SERVER_ERROR: 500,
	NOT_IMPLEMENTED: 501,
} as const satisfies Record<string, number>;

type RPC_ERROR_CODE_KEY = keyof typeof RPC_CODE_TO_HTTP_STATUS_CODE;

type ErrorOpts = {
	code: RPC_ERROR_CODE_KEY;
	type?: string;
	title?: string;
	detail?: string;
	extensions?: Record<string, any>;
	cause?: unknown;
};

/**
 * Follwoing the Problem Details for HTTP APIs specification RFC 9457 (https://datatracker.ietf.org/doc/html/rfc9457)
 */
export class RPCError extends Error {
	public readonly code;
	public readonly type;
	public readonly title;
	public readonly detail;
	public readonly extensions;

	constructor(opts: ErrorOpts) {
		const title = opts.title ?? opts.code;

		super(title);

		this.name = 'RPCError';
		this.code = opts.code;
		this.type = opts.type;
		this.title = title;
		this.detail = opts.detail;
		this.extensions = opts.extensions;
	}
}
