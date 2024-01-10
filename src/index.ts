import { MainServer } from './classes/MainServer';
import fs from 'fs';

const basePath = process.env['DOCUMENTS_PATH'] ?? 'documents/';

if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);

const mainServer = new MainServer();

mainServer.setup();
