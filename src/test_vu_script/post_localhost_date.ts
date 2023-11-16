export default async function (): Promise<void> {
  await fetch('http://localhost:8000/' + new Date().toISOString(), {
    method: 'POST'
  })
}
