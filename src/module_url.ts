import * as path from "std/path/mod.ts";

/**
 * Exception thrown by {@link moduleURLFromString}.
 */
export class ModuleURLException extends Error {
  constructor() {
    super('module URL must ends with ".js" or ".ts".');
  }
}
/**
 * Module URL define a syntactically valid module URL.
 */
export class ModuleURL {
  private readonly url: string;

  /**
   * Create a ModuleURL from a raw string.
   *
   * @param raw - string to convert to {@link ModuleURL}
   *
   * @throws {@link ModuleURLException}
   * This exception is thrown if module URL doesn't ends with ".js" or ".ts".
   */
  constructor(raw: string) {
    if (!raw.endsWith(".ts") && !raw.endsWith(".js")) {
      throw new ModuleURLException();
    }

    switch (raw.slice(0, 7)) {
      case "file://":
      case "http://":
      case "https:/":
        this.url = raw;
        break;

      default:
        this.url = `file://${path.resolve(raw)}`;
    }
  }

  toString() {
    return this.url;
  }
}

export default ModuleURL;
