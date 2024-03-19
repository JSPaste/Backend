import * as $protobuf from "protobufjs";
import Long = require("long");
/** Properties of a DocumentDataStruct. */
export interface IDocumentDataStruct {

    /** DocumentDataStruct rawFileData */
    rawFileData?: (Uint8Array|null);

    /** DocumentDataStruct secret */
    secret?: (string|null);

    /** DocumentDataStruct expirationTimestamp */
    expirationTimestamp?: (Long|null);

    /** DocumentDataStruct password */
    password?: (string|null);
}

/** Represents a DocumentDataStruct. */
export class DocumentDataStruct implements IDocumentDataStruct {

    /**
     * Constructs a new DocumentDataStruct.
     * @param [properties] Properties to set
     */
    constructor(properties?: IDocumentDataStruct);

    /** DocumentDataStruct rawFileData. */
    public rawFileData: Uint8Array;

    /** DocumentDataStruct secret. */
    public secret: string;

    /** DocumentDataStruct expirationTimestamp. */
    public expirationTimestamp?: (Long|null);

    /** DocumentDataStruct password. */
    public password?: (string|null);

    /** DocumentDataStruct _expirationTimestamp. */
    public _expirationTimestamp?: "expirationTimestamp";

    /** DocumentDataStruct _password. */
    public _password?: "password";

    /**
     * Encodes the specified DocumentDataStruct message. Does not implicitly {@link DocumentDataStruct.verify|verify} messages.
     * @param message DocumentDataStruct message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IDocumentDataStruct, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a DocumentDataStruct message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns DocumentDataStruct
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): DocumentDataStruct;

    /**
     * Verifies a DocumentDataStruct message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a DocumentDataStruct message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns DocumentDataStruct
     */
    public static fromObject(object: { [k: string]: any }): DocumentDataStruct;

    /**
     * Creates a plain object from a DocumentDataStruct message. Also converts values to other types if specified.
     * @param message DocumentDataStruct
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: DocumentDataStruct, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this DocumentDataStruct to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}
