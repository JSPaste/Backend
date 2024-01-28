import Elysia from 'elysia';
import { ErrorSender } from '../classes/ErrorSender';

export const errorSenderPlugin = new Elysia({
	name: 'plugins:errorHandler'
}).derive((context) => {
	return {
		errorSender: new ErrorSender(context)
	};
});
