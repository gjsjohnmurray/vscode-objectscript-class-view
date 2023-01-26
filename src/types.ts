/**
 * Structure of request body for HTTP POST /action/query.
 */
export type QueryData = {
	query: string,
	parameters: any[]
};
