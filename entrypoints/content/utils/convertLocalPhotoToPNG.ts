// Functions:
const convertLocalPhotoToPNG = async (localPhoto: File | undefined) => {
  if (!localPhoto) return
  return new Promise<File>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context!'))
        return
      }

      ctx.drawImage(image, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const pngFile = new File([blob], localPhoto.name.replace(/\.[^/.]+$/, '.png'), {
            type: 'image/png',
            lastModified: new Date().getTime(),
          })  
          resolve(pngFile)
        } else {
          reject(new Error('Blob creation failed!'))
        }
      }, 'image/png')
    }

    image.onerror = () => {
      reject(new Error('Image loading failed!'))
    }

    image.src = URL.createObjectURL(localPhoto)
  })
}

// Exports:
export default convertLocalPhotoToPNG
