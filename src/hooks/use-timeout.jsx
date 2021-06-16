// Packages:
import { useEffect, useCallback, useRef } from 'react';


// Functions:
const useTimeout = (callback,timeout) => {
	// Ref:
  const timeoutIDRef = useRef(undefined);
  const cancel = useCallback(() => {
    const timeoutId = timeoutIDRef.current;
    if (timeoutId) {
      timeoutIDRef.current = undefined;
      clearTimeout(timeoutId);
    }
  }, [timeoutIDRef]);
  
  // Effects:
  useEffect(() => {
    timeoutIDRef.current = setTimeout(callback, timeout);
    return cancel;
  }, [callback, timeout, cancel]);

  // Return:
  return cancel;
};

// Exports:
export default useTimeout;
