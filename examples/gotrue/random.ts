export const alphaNumCharset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function number (min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): number {
  return Math.random() * (max - min) + min
}

export function integer (min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): number {
  return Math.round(number(min, max))
}

export function string (length: number, charset = alphaNumCharset): string {
  const result = new Array(length)
  for (let i = 0; i < length; i++) {
    result[i] = charset[integer(0, charset.length - 1)]
  }

  return result.join('')
}

export function item<T> (arr: T[]): T {
  return arr[integer(0, arr.length - 1)]
}

export function email (): string {
  return item(['foo@example.com', 'bar@another.example.com'])
}

export function password (): string {
  return string(16)
}
