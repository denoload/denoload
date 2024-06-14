/**
 * Teardown service is responsible of tearing down allocated ressources.
 */
export interface Teardown {
  registerTeardownProcedure(proc: () => Promise<void> | void): void;
  teardown(): Promise<void> | void;
}

export function provideTeardown(): Teardown {
  const teardownProcedures: (() => Promise<void> | void)[] = [];

  return {
    registerTeardownProcedure(proc: () => Promise<void> | void) {
      teardownProcedures.push(proc);
    },
    async teardown(): Promise<void> {
      for (
        let proc = teardownProcedures.pop();
        proc !== undefined && proc !== null;
        proc = teardownProcedures.pop()
      ) {
        await proc();
      }
    },
  };
}
