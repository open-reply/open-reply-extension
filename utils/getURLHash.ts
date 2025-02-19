// Packages:
import logError from './logError'

// Constants:
const SPECIAL_DOMAINS = [
  'www.youtube.com',
  'www.google.com',
  'www.reddit.com',
  'search.yahoo.com',
  'search.yahoo.co.jp',
  
  'www.amazon.com',
  'www.amazon.in',
  'www.amazon.co.jp',
  'www.amazon.ca',
  'www.amazon.com.mx',
  'www.amazon.co.uk',
  'www.amazon.fr',
  'www.amazon.de',
  'www.amazon.it',
  'www.amazon.es',
  'www.amazon.nl',
  'www.amazon.com.tr',
  'www.amazon.sa',
  'www.amazon.ae',
  'www.amazon.se',
  'www.amazon.au',
  'www.amazon.sg',
  'www.amazon.com.br',
  
  'yandex.ru',
  'www.yandex.ru',
  'translate.yandex.ru',
]

// Functions:
const isSpecialDomain = (URLString: string) => {
  try {
    const host = (new URL(`https://${URLString}`)).host
    return SPECIAL_DOMAINS.includes(host)
  } catch (error) {
    logError({
      data: { URLString },
      error,
      functionName: 'isSpecialDomain',
    })
    return false
  }
}

const getSpecialDomainURLHash = (URLString: string) => {
  const URLObject = new URL(`https://${URLString}`)
  const host = URLObject.host, pathname = URLObject.pathname

  if (host === 'www.google.com') {
    if (pathname === '/search') {
      const query = URLObject.searchParams.get('q')
      const tbm = URLObject.searchParams.get('tbm')
      const udm = URLObject.searchParams.get('udm')
      if (!query) throw new Error('Unable to get Google search query from the URL!')
      const newURL = `${host}${pathname}?q=${query}${tbm && `&tbm=${tbm}`}${udm && `&udm=${udm}`}`
      return calculateSHA512(newURL)
    } else return calculateSHA512(URLString)
  } else if (host === 'www.youtube.com') {
    if (pathname === '/watch') {
      const videoID = URLObject.searchParams.get('v')
      if (!videoID) throw new Error('Unable to get YouTube Video ID from the URL!')
      const newURL = `${host}${pathname}?v=${videoID}`
      return calculateSHA512(newURL)
    } else if (pathname === '/results') {
      const searchQuery = URLObject.searchParams.get('search_query')
      if (!searchQuery) throw new Error('Unable to get YouTube search query from the URL!')
      const newURL = `${host}${pathname}?search_query=${searchQuery}`
      return calculateSHA512(newURL)
    } else if (pathname === '/playlist') {
      const playlistID = URLObject.searchParams.get('list')
      if (!playlistID) throw new Error('Unable to get YouTube Playlist ID from the URL!')
      const newURL = `${host}${pathname}?list=${playlistID}`
      return calculateSHA512(newURL)
    } else return calculateSHA512(URLString)
  } else if (host === 'www.reddit.com') {
    if (pathname === '/search') {
      const query = URLObject.searchParams.get('q')
      const type = URLObject.searchParams.get('type')
      const sort = URLObject.searchParams.get('sort')
      const nsfw = URLObject.searchParams.get('nsfw')
      if (!query) throw new Error('Unable to get Reddit search query from the URL!')
      const newURL = `${host}${pathname}?q=${query}${type && `&type=${type}`}${sort && `&sort=${sort}`}${nsfw && `&nsfw=${nsfw}`}`
      return calculateSHA512(newURL)
    } else return calculateSHA512(URLString)
  } else if (host === 'search.yahoo.com') {
    if (pathname === '/search') {
      const query = URLObject.searchParams.get('p')
      if (!query) throw new Error('Unable to get Yahoo search query from the URL!')
      const newURL = `${host}${pathname}?p=${query}`
      return calculateSHA512(newURL)
    } else return calculateSHA512(URLString)
  } else if (host === 'search.yahoo.co.jp') {
    if (pathname === '/search') {
      const query = URLObject.searchParams.get('p')
      if (!query) throw new Error('Unable to get Yahoo JP search query from the URL!')
      const newURL = `${host}${pathname}?p=${query}`
      return calculateSHA512(newURL)
    } else return calculateSHA512(URLString)
  } else if ([
    'www.amazon.com',
    'www.amazon.in',
    'www.amazon.co.jp',
    'www.amazon.ca',
    'www.amazon.com.mx',
    'www.amazon.co.uk',
    'www.amazon.fr',
    'www.amazon.de',
    'www.amazon.it',
    'www.amazon.es',
    'www.amazon.nl',
    'www.amazon.com.tr',
    'www.amazon.sa',
    'www.amazon.ae',
    'www.amazon.se',
    'www.amazon.au',
    'www.amazon.sg',
    'www.amazon.com.br',
  ].includes(host)) {
    if (pathname === '/s') {
      const query = URLObject.searchParams.get('k')
      if (!query) throw new Error('Unable to get Amazon search query from the URL!')
      const newURL = `${host}${pathname}?k=${query}`
      return calculateSHA512(newURL)
    } else return calculateSHA512(URLString)
  } else if (
    [
      'yandex.ru',
      'www.yandex.ru',
    ].includes(host)
  ) {
    if (
      [
        '/search',
        '/images/search',
        '/video/search',
        '/products/search',
      ].includes(pathname)
    ) {
      const text = URLObject.searchParams.get('text')
      if (!text) throw new Error('Unable to get Yandex search text from the URL!')
      const newURL = `${host}${pathname}?text=${text}`
      return calculateSHA512(newURL)
    } else return calculateSHA512(URLString)
  } else if (host === 'translate.yandex.ru') {
    const text = URLObject.searchParams.get('text')
    if (!text) throw new Error('Unable to get Yandex translation text from the URL!')
    const newURL = `${host}${pathname}?text=${text}`
    return calculateSHA512(newURL)
  }

  return calculateSHA512(URLString)
}

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
const getURLHash = async (URL: string): Promise<string> => {
  if (isSpecialDomain(URL)) return await getSpecialDomainURLHash(URL)

  return await calculateSHA512(URL)
}

export default getURLHash
