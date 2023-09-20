function reverseString(str: string): string {
  return str.split("").reverse().join("");
}

function extractFunctionArgs(rawfn: string): string {
  const lines = rawfn.split("\n");

  // We don't support arrow function for now
  if (!lines[0].startsWith("function")) {
    throw new Error("only function expressions and declaration are supported");
  }

  const firstParamIndex = lines[0].indexOf("(") + 1;
  const lastParamIndex = lines[0].length -
    reverseString(lines[0]).indexOf(")") - 1;

  // Remove "function <name>(" prefix
  // and ") {" suffix
  return lines[0].slice(firstParamIndex, lastParamIndex);
}

function extractFunctionBody(rawfn: string): string {
  const lines = rawfn.split("\n");

  // We don't support arrow function for now
  if (!lines[0].startsWith("function")) {
    throw new Error("only function expressions and declaration are supported");
  }

  // Function.toString() returns a string with one statement per line.
  // First line is    : function <name>() {
  // and last line is : }
  // If we have less than three line, the function is empty.
  if (lines.length < 3) {
    return "";
  }

  return lines.splice(1, lines.length - 2).join("\n");
}

export function runWithGlobalContext(
  // deno-lint-ignore no-explicit-any
  globalContext: any,
  fn: (...args: unknown[]) => unknown,
  ...args: unknown[]
) {
  const virtualFunc = new Function(`
      const globalThis = arguments[0]
      with(globalThis) {
        for (let i = 0; i < arguments.length - 1; i++) {
          arguments[i] = arguments[i+1]
        }
        arguments[arguments.length - 1] = undefined

        let [${extractFunctionArgs(fn.toString())}] = arguments
        ${extractFunctionBody(fn.toString())}
      }
  `);

  virtualFunc(globalContext, ...args);
}
