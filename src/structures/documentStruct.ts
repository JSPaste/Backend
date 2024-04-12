import { decode, encode } from 'cbor-x';

export interface IDocumentDataStruct {
	rawFileData?: Uint8Array | null;
	secret?: string | null;
	expirationTimestamp?: number | null;
	password?: string | null;
}

export class DocumentDataStruct implements IDocumentDataStruct {
	/**
	 * Constructs a new DocumentDataStruct.
	 * @param [properties] Properties to set
	 */
	constructor(properties?: IDocumentDataStruct) {
		if (properties)
			for (
				let keys = Object.keys(properties), i = 0;
				i < keys.length;
				++i
			)
				if (properties[keys[i]] != null)
					this[keys[i]] = properties[keys[i]];
	}

	/** DocumentDataStruct rawFileData. */
	public rawFileData: Uint8Array = new Uint8Array();

	/** DocumentDataStruct secret. */
	public secret: string = '';

	/** DocumentDataStruct expirationTimestamp. */
	public expirationTimestamp?: number | null;

	/** DocumentDataStruct password. */
	public password?: string | null;

	/** DocumentDataStruct _expirationTimestamp. */
	public _expirationTimestamp?: 'expirationTimestamp';

	/** DocumentDataStruct _password. */
	public _password?: 'password';

	/**
	 * Encodes the specified DocumentDataStruct message. Does not implicitly {@link DocumentDataStruct.verify|verify} messages.
	 * @param message DocumentDataStruct message or plain object to encode
	 * @param [writer] Writer to encode to
	 * @returns Writer
	 */

	public static encode(message: IDocumentDataStruct) {
		return encode(message);
	}

	/**
	 * Decodes a DocumentDataStruct message from the specified reader or buffer.
	 * @param reader Reader or buffer to decode from
	 * @param [length] Message length if known beforehand
	 * @returns DocumentDataStruct
	 * @throws {Error} If the payload is not a reader or valid buffer
	 * @throws {$protobuf.util.ProtocolError} If required fields are missing
	 */
	public static decode(buffer: Uint8Array): DocumentDataStruct {
		return decode(Buffer.from(buffer));
	}
}
