import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import swagger from '@elysiajs/swagger';

const apiVersions = ['v1', 'v2'];

export class MainServer {
	app: Elysia;
	port: string | number;

	constructor() {
		this.app = new Elysia();
		this.port = process.env.PORT ?? 4000;

		this.setup();
	}

	setup() {
		this.app.use(cors()).use(
			swagger({
				documentation: {
					info: {
						title: 'JSPaste documentation',
						version: 'v1',
						description: 'The JSPaste API documentation.',
						license: {
							name: 'EUPL-1.2-or-later',
							url: 'https://github.com/JSPaste/JSP-Backend/blob/dev/LICENSE',
						},
					},
				},
				swaggerOptions: {},
				path: '/docs',
				exclude: ['/docs', '/docs/json'],
			}),
		);

		console.log('JSP-Backend started.');

		return this;
	}

	listen() {
		this.app.listen(this.port, () =>
			console.log('Listening on port', this.port),
		);
	}
}
