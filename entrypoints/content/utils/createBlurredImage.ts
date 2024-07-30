// Packages:
import logError from './logError'
import returnable from './returnable'

// Typescript:
import type { Returnable } from '../types'

// Functions:
const _createBlurredImage = async (base64Image: string, blurAmount: number = 5) => {
  return new Promise<string>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Unable to get 2D context'))
        return
      }

      canvas.width = img.width
      canvas.height = img.height

      ctx.drawImage(img, 0, 0)
      ctx.filter = `blur(${blurAmount}px)`
      ctx.drawImage(canvas, 0, 0)
      ctx.filter = 'none'


      const blurredBase64 = canvas.toDataURL('image/png')
      resolve(blurredBase64)
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = base64Image
  })
}

const createBlurredImage = async (base64Image: string, blurAmount: number = 5): Promise<Returnable<string, Error>> => {
  try {
    const blurredImage = await _createBlurredImage(base64Image, blurAmount)

    return returnable.success(blurredImage)
  } catch (error) {
    logError({
      functionName: 'createBlurredImage',
      data: {
        base64Image,
        blurAmount,
      },
      error,
    })

    return returnable.fail(error as unknown as Error)
  }
}

// Exports:
export default createBlurredImage
