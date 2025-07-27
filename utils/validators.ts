// this connect to connectUserDB.ts
export function isValidMongoUri(uri: string): boolean {
  try {
    // More flexible regex that handles various MongoDB URI formats
    const regex = /^mongodb(?:\+srv)?:\/\/(?:(?:[^:]+:[^@]+@)?[^\/]+)(?:\/[^?]*)?(?:\?.*)?$/;
    return regex.test(uri);
  } catch {
    return false;
  }
}