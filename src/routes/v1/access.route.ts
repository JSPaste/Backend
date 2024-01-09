import { Elysia, t } from 'elysia';

export default new Elysia({
	name: 'routes:v1:documents:access',
})
	.get(
		':id',
		({ params: { id } }) => {
			return {
				key: id,
				data: 'cl',
			};
		},
		{
			params: t.Object({
				id: t.String({ description: 'The document ID' }),
			}),
			response: t.Object({
				key: t.String({ description: 'The key of the document' }),
				data: t.Any({ description: 'The document' }),
			}),
			detail: { summary: 'Get document by ID', tags: ['v1'] },
		},
	)
	.get(
		':id/raw',
		({ params: { id } }) => {
			return id;
		},
		{
			params: t.Object(
				{
					id: t.String({ description: 'The document ID' }),
				},
				{ description: 'The request parameters' },
			),
			response: t.String({ description: 'The raw document' }),
			detail: { summary: 'Get raw document by ID', tags: ['v1'] },
		},
	);
