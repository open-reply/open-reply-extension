// Functions:
const getPhotoURLFromUID = (UID: string) => {
  return `https://firebasestorage.googleapis.com/v0/b/openreply-app.appspot.com/o/users%2F${UID}.png?alt=media`
}

// Exports:
export default getPhotoURLFromUID
