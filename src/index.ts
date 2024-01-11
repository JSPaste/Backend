import { MainServer } from './classes/MainServer';
import fs from 'fs';

export const basePath = process.env.DOCUMENTS_PATH ?? 'documents/';
export const maxDocLength = parseInt(process.env.MAX_FILE_LENGHT ?? '50000');

if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);

const mainServer = new MainServer();

mainServer.setup();
