import { Hono } from 'hono';
import { accessRoute } from './access.route.ts';
import { accessRawRoute } from './accessRaw.route.ts';
import { publishRoute } from './publish.route.ts';
import { removeRoute } from './remove.route.ts';

export default class V1 {
	private static readonly _endpoint = new Hono();

	public static register() {
		V1._endpoint.get('/', (ctx) => {
			return ctx.text('Welcome to JSPaste API v1');
		});

		accessRoute(V1._endpoint);
		accessRawRoute(V1._endpoint);
		publishRoute(V1._endpoint);
		removeRoute(V1._endpoint);

		return V1._endpoint;
	}
}
