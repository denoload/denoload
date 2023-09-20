import {
  assert,
  assertFalse,
} from "https://deno.land/std@0.202.0/assert/mod.ts";

import { runWithGlobalContext } from "./vm.ts";

Deno.test("run function declaration in vm", () => {
  function fnDeclaration(args) {
    // insideVM is declared only in VM global scope.
    args.value = insideVM;
  }

  const args = { value: false };
  runWithGlobalContext({ insideVM: true }, fnDeclaration, args);

  assert(args.value, "insideVM variable wasn't used");
});

Deno.test("run function expression in vm", () => {
  const args = { value: false };
  runWithGlobalContext({ insideVM: true }, function fnExpression(args) {
    // insideVM is declared only in VM global scope.
    args.value = insideVM;
  }, args);

  assert(args.value, "insideVM variable wasn't used");
});

Deno.test("function executed in vm can't modify global scope", () => {
  let outside = false;

  function fnDeclaration() {
    // insideVM is declared only in VM global scope.
    outside = true;
  }

  runWithGlobalContext({}, fnDeclaration);

  assertFalse(outside, "insideVM variable wasn't used");
});
