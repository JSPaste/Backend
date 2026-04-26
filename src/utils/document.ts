import { constantDocumentNameLengthDefault, constantNanoid, mutableDatabase, mutableRootId } from "#/global.ts";

// deflate
export const documentVersionV1 = 1;
// no compression
export const documentVersionV2 = 2;

export type DocumentVersionType = typeof documentVersionV1 | typeof documentVersionV2;

export const generateName = (length = constantDocumentNameLengthDefault): string => {
  let name: string;
  do {
    name = constantNanoid(length);
  } while (mutableDatabase.document.get("name", name)?.name);

  return name;
};

export const isOwner = (userId?: string | null, documentUserId?: string | null): boolean => {
  // the document is not owned, everyone can alter
  if (!documentUserId) {
    return true;
  }

  if (userId) {
    // the document is owned by the user
    if (userId === documentUserId) {
      return true;
    }

    // the root user can alter everything
    if (userId === mutableRootId) {
      return true;
    }
  }

  return false;
};
