import { constant, mutable } from "#/global.ts";

export const generateName = (length = 8): string => {
  let name: string;
  do {
    name = constant.nanoid(length);
  } while (mutable.database.document.get("name", name)?.name);

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
    if (userId === mutable.database.user.getRoot()?.id) {
      return true;
    }
  }

  return false;
};
