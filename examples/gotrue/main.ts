import { faker } from "@faker-js/faker";
import { GoTrueClient } from "@supabase/gotrue-js";
import { type Report, globalRegistry } from "@negrel/denoload-metrics";
import expect from "expect";

export const options = {
  threshold: ({ metrics }: { metrics: Report }) => {
    // No failed iterations.
    expect(metrics.trends.iterations).not.toHaveProperty("fail");
  },
  scenarios: {
    perVuIter: {
      executor: "per-vu-iterations",
      vus: 16,
      iterations: 10,
      maxDuration: "1m",
    },
  },
};

const AuthClient = new GoTrueClient({ url: "http://gotrue.local" });
const signUpCounter = globalRegistry.Counter("signup");
const signOutCounter = globalRegistry.Counter("signout");

export default async function (): Promise<void> {
  // Sign up and sign in.
  {
    const { data, error } = await AuthClient.signUp({
      email: faker.internet.email(),
      password: faker.internet.password(),
    });
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    signUpCounter.add(1);
  }

  await Bun.sleep(1000);

  // Interact with your API.

  // Sign out.
  {
    const { error } = await AuthClient.signOut();
    expect(error).toBeNull();
    signOutCounter.add(1);
  }
}
