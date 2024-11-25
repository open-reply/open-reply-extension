// Typescript:
import type { LastVisible } from 'types/internal-messaging'

// Functions:
const handleLastVisible = async ({
  handler,
  key,
  request,
  additionalProps,
  tabID,
  lastVisible,
  iterable,
}: {
  handler: (props: any) => Promise<any>
  key: string
  request: any
  additionalProps?: any
  tabID: number | undefined
  lastVisible: LastVisible
  iterable: string
}) => {
  try {
    if (
      !tabID ||
      (lastVisible[tabID]?.[key]?.reachedEnd && !request.payload.resetPointer)
    ) return
  
    if (request.payload.lastVisibleID === null || request.payload.resetPointer) {
      lastVisible = {
        ...lastVisible,
        [tabID]: {
          ...lastVisible[tabID],
          [key]: {
            id: null,
            snapshot: null,
            reachedEnd: false,
          }
        }
      }
    }
  
    const response = await handler({
      ...request.payload,
      ...additionalProps,
      lastVisible: lastVisible[tabID]?.[key]?.snapshot ?? null,
    })
  
    if (response.status) {
      return {
        key,
        lastVisibleInstance: response.payload.lastVisibleInstance,
        response: {
          status: response.status,
          payload: {
            [iterable]: response.payload[iterable],
            lastVisibleID: response.payload.lastVisibleInstance.id,
          }
        }
      }
    }
  } catch (error) {
    logError({
      functionName: 'handleLastVisible',
      data: {
        handler,
        key,
        request,
        tabID,
        lastVisible,
        iterable,
      },
      error,
    })
  }
}

// Exports:
export default handleLastVisible
