// Packages:
import { v4 as uuidv4 } from 'uuid'

// Functions:
const logError = ({ functionName, error, data }: { functionName: string, error: unknown, data: any }) => {
  const errorID = uuidv4()
  console.error(`[${ Date.now() }] ERROR - ${ errorID } - ${ functionName } threw error: `, error)
  console.error(`[${ Date.now() }] ERROR - ${ errorID } - ${ functionName } crashed with data: `, data)
}

// Exports:
export default logError
