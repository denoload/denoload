import os from "node:os";

export function numCpus() {
  return os.cpus().length;
}
