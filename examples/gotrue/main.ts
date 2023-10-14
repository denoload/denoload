import { GoTrueClient } from '@supabase/gotrue-js'
import * as random from './random.ts'

export const options = {
  scenarios: {
    perVuIter: {
      executor: 'per-vu-iterations',
      vus: 512,
      iterations: 10
    }
  }
}

const AuthClient = new GoTrueClient({ url: 'http://gotrue.local' })

export default async function (): Promise<void> {
  // Sign up and sign in.
  await AuthClient.signUp({
    email: random.email(),
    password: random.password()
  })

  await Bun.sleep(1000)

  // Interact with your API

  await AuthClient.signOut()
}
