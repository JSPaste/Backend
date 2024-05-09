import { Hono } from 'hono';
import { accessRoute } from './access.route.ts';
import { accessRawRoute } from './accessRaw.route.ts';
import { editRoute } from './edit.route.ts';
import { existsRoute } from './exists.route.ts';
import { publishRoute } from './publish.route.ts';
import { removeRoute } from './remove.route.ts';

export default class V2 {
	public static endpoint = new Hono();

	static setup() {
		V2.endpoint.get('/', (ctx) => {
			return ctx.text('Welcome to JSPaste API v2');
		});

		accessRoute(V2.endpoint);
		accessRawRoute(V2.endpoint);
		editRoute(V2.endpoint);
		existsRoute(V2.endpoint);
		publishRoute(V2.endpoint);
		removeRoute(V2.endpoint);
	}
}
