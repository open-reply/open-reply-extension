import { useState } from 'react';

export const useInput = (initialValue) => {
  const [value, setValue] = useState(initialValue);

  return {
    value,
    setValue,
    reset: () => setValue(''),
    bind: {
      value,
      onChange: (event) => {
        event.preventDefault();
        event.stopPropagation();
        setValue(event.currentTarget.value);
      },
    },
  };
};
