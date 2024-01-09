import { Elysia, t } from 'elysia';

const basePath = process.env.DOCUMENTS_PATH;

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
				id: t.String({
					description: 'The document ID',
					examples: ['abc123'],
				}),
			}),
			response: t.Object({
				key: t.String({
					description: 'The key of the document',
					examples: ['abc123'],
				}),
				data: t.Any({
					description: 'The document',
					examples: ['Hello world'],
				}),
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
					id: t.String({
						description: 'The document ID',
						examples: ['abc123'],
					}),
				},
				{
					description: 'The request parameters',
					examples: [{ id: 'abc123' }],
				},
			),
			response: t.String({
				description: 'The raw document',
				examples: ['Hello world'],
			}),
			detail: {
				summary: 'Get raw document by ID',
				tags: ['v1'],
			},
		},
	);
