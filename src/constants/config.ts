
export const basePath = process.env['DOCUMENTS_PATH'] ?? 'documents/';
export const maxDocLength = parseInt(process.env['MAX_FILE_LENGTH'] ?? '2000000');