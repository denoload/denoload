import os from "node:os";

export function numCpus(): number {
  return os.cpus().length;
}
