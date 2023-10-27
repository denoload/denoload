export default async function (): Promise<void> {
  try {
    await fetch('http://localhost:8000/')
  } catch (err) {
    console.error('error while fetching catched', err)
  }
}
