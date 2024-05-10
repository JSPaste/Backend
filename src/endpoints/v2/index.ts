import { Hono } from 'hono';
import { accessRoute } from './access.route.ts';
import { accessRawRoute } from './accessRaw.route.ts';
import { editRoute } from './edit.route.ts';
import { existsRoute } from './exists.route.ts';
import { publishRoute } from './publish.route.ts';
import { removeRoute } from './remove.route.ts';

export default class V2 {
	private static readonly _endpoint = new Hono();

	public static register() {
		V2._endpoint.get('/', (ctx) => {
			return ctx.text('Welcome to JSPaste API v2');
		});

		accessRoute(V2._endpoint);
		accessRawRoute(V2._endpoint);
		editRoute(V2._endpoint);
		existsRoute(V2._endpoint);
		publishRoute(V2._endpoint);
		removeRoute(V2._endpoint);

		return V2._endpoint;
	}
}
