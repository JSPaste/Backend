/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const DocumentDataStruct = $root.DocumentDataStruct = (() => {

    /**
     * Properties of a DocumentDataStruct.
     * @exports IDocumentDataStruct
     * @interface IDocumentDataStruct
     * @property {Uint8Array|null} [rawFileData] DocumentDataStruct rawFileData
     * @property {string|null} [secret] DocumentDataStruct secret
     * @property {number|Long|null} [expirationTimestamp] DocumentDataStruct expirationTimestamp
     * @property {string|null} [password] DocumentDataStruct password
     */

    /**
     * Constructs a new DocumentDataStruct.
     * @exports DocumentDataStruct
     * @classdesc Represents a DocumentDataStruct.
     * @implements IDocumentDataStruct
     * @constructor
     * @param {IDocumentDataStruct=} [properties] Properties to set
     */
    function DocumentDataStruct(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * DocumentDataStruct rawFileData.
     * @member {Uint8Array} rawFileData
     * @memberof DocumentDataStruct
     * @instance
     */
    DocumentDataStruct.prototype.rawFileData = $util.newBuffer([]);

    /**
     * DocumentDataStruct secret.
     * @member {string} secret
     * @memberof DocumentDataStruct
     * @instance
     */
    DocumentDataStruct.prototype.secret = "";

    /**
     * DocumentDataStruct expirationTimestamp.
     * @member {number|Long|null|undefined} expirationTimestamp
     * @memberof DocumentDataStruct
     * @instance
     */
    DocumentDataStruct.prototype.expirationTimestamp = null;

    /**
     * DocumentDataStruct password.
     * @member {string|null|undefined} password
     * @memberof DocumentDataStruct
     * @instance
     */
    DocumentDataStruct.prototype.password = null;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * DocumentDataStruct _expirationTimestamp.
     * @member {"expirationTimestamp"|undefined} _expirationTimestamp
     * @memberof DocumentDataStruct
     * @instance
     */
    Object.defineProperty(DocumentDataStruct.prototype, "_expirationTimestamp", {
        get: $util.oneOfGetter($oneOfFields = ["expirationTimestamp"]),
        set: $util.oneOfSetter($oneOfFields)
    });

    /**
     * DocumentDataStruct _password.
     * @member {"password"|undefined} _password
     * @memberof DocumentDataStruct
     * @instance
     */
    Object.defineProperty(DocumentDataStruct.prototype, "_password", {
        get: $util.oneOfGetter($oneOfFields = ["password"]),
        set: $util.oneOfSetter($oneOfFields)
    });

    /**
     * Encodes the specified DocumentDataStruct message. Does not implicitly {@link DocumentDataStruct.verify|verify} messages.
     * @function encode
     * @memberof DocumentDataStruct
     * @static
     * @param {IDocumentDataStruct} message DocumentDataStruct message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DocumentDataStruct.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.rawFileData != null && Object.hasOwnProperty.call(message, "rawFileData"))
            writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.rawFileData);
        if (message.secret != null && Object.hasOwnProperty.call(message, "secret"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.secret);
        if (message.expirationTimestamp != null && Object.hasOwnProperty.call(message, "expirationTimestamp"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.expirationTimestamp);
        if (message.password != null && Object.hasOwnProperty.call(message, "password"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.password);
        return writer;
    };

    /**
     * Encodes the specified DocumentDataStruct message, length delimited. Does not implicitly {@link DocumentDataStruct.verify|verify} messages.
     * @function encodeDelimited
     * @memberof DocumentDataStruct
     * @static
     * @param {IDocumentDataStruct} message DocumentDataStruct message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DocumentDataStruct.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a DocumentDataStruct message from the specified reader or buffer.
     * @function decode
     * @memberof DocumentDataStruct
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {DocumentDataStruct} DocumentDataStruct
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DocumentDataStruct.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.DocumentDataStruct();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.rawFileData = reader.bytes();
                    break;
                }
            case 2: {
                    message.secret = reader.string();
                    break;
                }
            case 3: {
                    message.expirationTimestamp = reader.uint64();
                    break;
                }
            case 4: {
                    message.password = reader.string();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a DocumentDataStruct message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof DocumentDataStruct
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {DocumentDataStruct} DocumentDataStruct
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DocumentDataStruct.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a DocumentDataStruct message.
     * @function verify
     * @memberof DocumentDataStruct
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    DocumentDataStruct.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        let properties = {};
        if (message.rawFileData != null && message.hasOwnProperty("rawFileData"))
            if (!(message.rawFileData && typeof message.rawFileData.length === "number" || $util.isString(message.rawFileData)))
                return "rawFileData: buffer expected";
        if (message.secret != null && message.hasOwnProperty("secret"))
            if (!$util.isString(message.secret))
                return "secret: string expected";
        if (message.expirationTimestamp != null && message.hasOwnProperty("expirationTimestamp")) {
            properties._expirationTimestamp = 1;
            if (!$util.isInteger(message.expirationTimestamp) && !(message.expirationTimestamp && $util.isInteger(message.expirationTimestamp.low) && $util.isInteger(message.expirationTimestamp.high)))
                return "expirationTimestamp: integer|Long expected";
        }
        if (message.password != null && message.hasOwnProperty("password")) {
            properties._password = 1;
            if (!$util.isString(message.password))
                return "password: string expected";
        }
        return null;
    };

    /**
     * Creates a DocumentDataStruct message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof DocumentDataStruct
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {DocumentDataStruct} DocumentDataStruct
     */
    DocumentDataStruct.fromObject = function fromObject(object) {
        if (object instanceof $root.DocumentDataStruct)
            return object;
        let message = new $root.DocumentDataStruct();
        if (object.rawFileData != null)
            if (typeof object.rawFileData === "string")
                $util.base64.decode(object.rawFileData, message.rawFileData = $util.newBuffer($util.base64.length(object.rawFileData)), 0);
            else if (object.rawFileData.length >= 0)
                message.rawFileData = object.rawFileData;
        if (object.secret != null)
            message.secret = String(object.secret);
        if (object.expirationTimestamp != null)
            if ($util.Long)
                (message.expirationTimestamp = $util.Long.fromValue(object.expirationTimestamp)).unsigned = true;
            else if (typeof object.expirationTimestamp === "string")
                message.expirationTimestamp = parseInt(object.expirationTimestamp, 10);
            else if (typeof object.expirationTimestamp === "number")
                message.expirationTimestamp = object.expirationTimestamp;
            else if (typeof object.expirationTimestamp === "object")
                message.expirationTimestamp = new $util.LongBits(object.expirationTimestamp.low >>> 0, object.expirationTimestamp.high >>> 0).toNumber(true);
        if (object.password != null)
            message.password = String(object.password);
        return message;
    };

    /**
     * Creates a plain object from a DocumentDataStruct message. Also converts values to other types if specified.
     * @function toObject
     * @memberof DocumentDataStruct
     * @static
     * @param {DocumentDataStruct} message DocumentDataStruct
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    DocumentDataStruct.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            if (options.bytes === String)
                object.rawFileData = "";
            else {
                object.rawFileData = [];
                if (options.bytes !== Array)
                    object.rawFileData = $util.newBuffer(object.rawFileData);
            }
            object.secret = "";
        }
        if (message.rawFileData != null && message.hasOwnProperty("rawFileData"))
            object.rawFileData = options.bytes === String ? $util.base64.encode(message.rawFileData, 0, message.rawFileData.length) : options.bytes === Array ? Array.prototype.slice.call(message.rawFileData) : message.rawFileData;
        if (message.secret != null && message.hasOwnProperty("secret"))
            object.secret = message.secret;
        if (message.expirationTimestamp != null && message.hasOwnProperty("expirationTimestamp")) {
            if (typeof message.expirationTimestamp === "number")
                object.expirationTimestamp = options.longs === String ? String(message.expirationTimestamp) : message.expirationTimestamp;
            else
                object.expirationTimestamp = options.longs === String ? $util.Long.prototype.toString.call(message.expirationTimestamp) : options.longs === Number ? new $util.LongBits(message.expirationTimestamp.low >>> 0, message.expirationTimestamp.high >>> 0).toNumber(true) : message.expirationTimestamp;
            if (options.oneofs)
                object._expirationTimestamp = "expirationTimestamp";
        }
        if (message.password != null && message.hasOwnProperty("password")) {
            object.password = message.password;
            if (options.oneofs)
                object._password = "password";
        }
        return object;
    };

    /**
     * Converts this DocumentDataStruct to JSON.
     * @function toJSON
     * @memberof DocumentDataStruct
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    DocumentDataStruct.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return DocumentDataStruct;
})();

export { $root as default };
