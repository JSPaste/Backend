import { Hono } from 'hono';
import { accessRoute } from './access.route.ts';
import { accessRawRoute } from './accessRaw.route.ts';
import { publishRoute } from './publish.route.ts';
import { removeRoute } from './remove.route.ts';

export default class V1 {
	public static endpoint = new Hono();

	static {
		V1.endpoint.get('/', (ctx) => {
			return ctx.text('Welcome to JSPaste API v1');
		});

		accessRoute(V1.endpoint);
		accessRawRoute(V1.endpoint);
		publishRoute(V1.endpoint);
		removeRoute(V1.endpoint);
	}
}
