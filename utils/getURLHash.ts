// Exports:
/**
 * Generate the SHA512 hash of a given message.
 * 
 * @param message The message to be hashed
 */
export const calculateSHA512 = async (message: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-512', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHEX = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
  return hashHEX
}

/**
 * Turn a URL into URLHash
 * 
 * @param URL `window.location.host + window.location.pathname + window.location.search`
 */
const getURLHash = async (URL: string) => await calculateSHA512(URL)

export default getURLHash
