import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

export class MainServer {
	app: Elysia;
	port: string | number;

	constructor() {
		this.app = new Elysia();
		this.port = process.env.PORT ?? 4004;
	}

	setup() {
		this.app.use(cors());

		console.log('JSP-Backend started.');

		return this;
	}

	listen() {
		this.app.listen(this.port, () =>
			console.log('Listening on port', this.port)
		);
	}
}
