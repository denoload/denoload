import {
  TestModule,
  TestModuleOptions,
  TestScenario,
} from "@/public/test_module.ts";

export function assertTestModule(
  input: unknown,
): asserts input is TestModule<unknown> {
  if (input === null || input === undefined || typeof input !== "object") {
    throw new Error("module is not an object");
  }
  if (!("options" in input)) {
    throw new Error("options field missing in module");
  }
  assertTestModuleOptions(input["options"]);
}

export function assertTestModuleOptions(
  input: unknown,
): asserts input is TestModuleOptions {
  if (input === null || input === undefined || typeof input !== "object") {
    throw new Error("options is not an object");
  }
  if (!("scenarios" in input)) {
    throw new Error("scenarios field missing in test module options");
  }
  assertTestScenariosRecord(input["scenarios"]);
}

export function assertTestScenariosRecord(
  input: unknown,
): asserts input is Record<string, TestScenario> {
  if (input === null || input === undefined || typeof input !== "object") {
    throw new Error("scenarios is not an object");
  }

  const record = input as Record<string, unknown>;

  if (Object.entries(record).length === 0) {
    throw new Error("scenarios is empty");
  }

  for (const scenario in record) {
    assertTestScenario(record[scenario]);
  }
}

export function assertTestScenario(
  input: unknown,
): asserts input is TestScenario {
  if (input === null || input === undefined || typeof input !== "object") {
    throw new Error("scenario is not an object");
  }

  if (!("executor" in input)) {
    throw new Error("executor field missing");
  }
  if (input["executor"] !== "per-vu-iterations") {
    throw new Error("executor field not 'per-vu-iterations'");
  }

  if (!("vus" in input)) {
    throw new Error("vus field missing");
  }
  if (typeof input["vus"] !== "number" || input["vus"] <= 0) {
    throw new Error("vus field must be a positive number");
  }

  if (!("iterations" in input)) {
    throw new Error("iterations field missing");
  }
  if (typeof input["iterations"] !== "number" || input["iterations"] <= 0) {
    throw new Error("iterations field must be a positive number");
  }
}
