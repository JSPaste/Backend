import { decode, encode } from 'cbor-x';
import { unescapeLeadingUnderscores } from 'typescript';

export interface IDocumentDataStruct {
	rawFileData?: Uint8Array | null;
	secret?: string | null;
	expirationTimestamp?: number | null;
	password?: string | null;
}

export class DocumentDataStruct implements IDocumentDataStruct {
	constructor(properties?: IDocumentDataStruct) {
		if (properties) {
			for (
				let keys = Object.keys(properties), i = 0;
				i < keys.length;
				++i
			) {
				if (properties[keys[i]] != null) {
					this[keys[i]] = properties[keys[i]];
				}
			}
		}
	}

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
