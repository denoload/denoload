import { GoTrueClient } from '@supabase/gotrue-js'

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

function randomEmail (): string {
  return ''
}

function randomPassword (): string {
  return ''
}

export default async function (): Promise<void> {
  // Sign up and sign in.
  await AuthClient.signUp({
    email: randomEmail(),
    password: randomPassword()
  })

  await Bun.sleep(1000)

  // Interact with your API

  await AuthClient.signOut()
}
