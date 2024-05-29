import type { Hono } from '@hono/hono';
import { removeRoute as removeRouteV1 } from '../../endpoints/v1/remove.route.ts';

export const removeRoute = (endpoint: Hono) => {
	removeRouteV1(endpoint);
};
