import { decode, encode } from 'cbor-x';

export interface IDocumentDataStruct {
	rawFileData?: Uint8Array | null;
	secret?: string | null;
	expirationTimestamp?: number | null;
	password?: string | null;
}

export class DocumentDataStruct implements IDocumentDataStruct {


	public rawFileData: Uint8Array = new Uint8Array();

	public secret: string = '';

	public expirationTimestamp?: number;

	public password?: string;

	public _expirationTimestamp?: 'expirationTimestamp';

	public _password?: 'password';

	public static encode(message: IDocumentDataStruct) {
		return encode(message);
	}

	public static decode(buffer: Uint8Array): DocumentDataStruct {
		return decode(buffer);
	}
}
