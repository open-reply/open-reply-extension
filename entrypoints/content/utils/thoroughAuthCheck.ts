// Packages:
import returnable from 'utils/returnable'
import { getRDBUser } from '../firebase/realtime-database/users/get'
import thoroughUserDetailsCheck from 'utils/thoroughUserDetailsCheck'

// Typescript:
import { type User } from 'firebase/auth'
import { Returnable } from 'types/index'

// Functions:
const thoroughAuthCheck = async (currentUser: User | null): Promise<Returnable<null, string>> => {
  if (!currentUser) return returnable.fail('Please login to continue!')

  const RDBUserResult = await getRDBUser(currentUser.uid)
  if (!RDBUserResult.status) return returnable.fail(RDBUserResult.payload.message)

  const userCheckResult = thoroughUserDetailsCheck(currentUser, currentUser.displayName, RDBUserResult.payload?.username)
  if (!userCheckResult.status) return returnable.fail(userCheckResult.payload)

  return returnable.success(null)
}

// Exports:
export default thoroughAuthCheck
