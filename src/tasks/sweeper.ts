import { mapNotNullish } from "@std/collections";
import { decodeTime } from "@std/ulid";
import { constantTemporalUTC, mutable } from "#/global.ts";
import { Database } from "#db/index.ts";
import { Logger } from "#util/console.ts";
import { env } from "../utils/env.ts";
import { fsDelete, fsList } from "../utils/fs.ts";

const log: Logger = new Logger("task::sweeper");

export const sweeper = async (): Promise<void> => {
  sweeperDatabaseUser();
  sweeperDatabaseDocument();

  // sweeper will remove everything in storage on ephemeral
  if (!env.JSPB_DEBUG_DATABASE_EPHEMERAL) {
    await sweeperDangling();
  }
};

const sweeperDatabaseUser = (): void => {
  using database = new Database();

  const temporalFuture = constantTemporalUTC().add({ days: 3 });

  const users = mapNotNullish(database.user.getAllWithoutDocuments(), ({ id }) => {
    if (!id) return;
    if (id === mutable.database.user.getRoot()?.id) return;

    if (temporalFuture.epochMilliseconds > decodeTime(id)) {
      return id;
    }

    return;
  });

  if (users.length > 0) {
    database.user.delete("id", users);
    log.debug(`Removed ${users.length} unused user records.`);
  }
};

const sweeperDatabaseDocument = (): void => {
  using database = new Database();

  const temporalNow = constantTemporalUTC();

  const documents = mapNotNullish(database.document.getAll(["id", "user_id"]), ({ id, user_id }) => {
    if (!id) return;

    const ageType = user_id
      ? env.JSPB_DOCUMENT_AGE.total("milliseconds")
      : env.JSPB_DOCUMENT_ANONYMOUS_AGE.total("milliseconds");

    if (ageType > 0 && temporalNow.epochMilliseconds - decodeTime(id) > ageType) {
      return id;
    }

    return;
  });

  if (documents.length > 0) {
    database.document.delete("id", documents);
    log.debug(`Removed ${documents.length} expired document records.`);
  }
};

const sweeperDangling = async (): Promise<void> => {
  using database = new Database();

  const databaseDocuments = mapNotNullish(database.document.getAll(["id"]), ({ id }) => id);
  const storageDocuments = fsList(true);

  const databaseDocumentsSet = new Set(databaseDocuments);
  const storageDocumentsSet = new Set(storageDocuments);

  const databaseDocumentsDangling = databaseDocumentsSet.difference(storageDocumentsSet);
  const storageDocumentsDangling = storageDocumentsSet.difference(databaseDocumentsSet);

  const queue: Promise<void>[] = [];

  if (databaseDocumentsDangling.size > 0) {
    database.document.delete("id", databaseDocumentsDangling);
    log.debug(`Removed ${databaseDocumentsDangling.size} dangling records.`);
  }

  if (storageDocumentsDangling.size > 0) {
    for (const id of storageDocumentsDangling) {
      queue.push(fsDelete({ id: id }));
    }

    await Promise.all(queue);

    log.debug(`Removed ${storageDocumentsDangling.size} dangling files.`);
  }
};
