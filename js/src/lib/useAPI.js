import { useMemo, useContext } from 'react';
import LoginContext from '../context/LoginContext';

export const useAPI = (cls) => {
  const { onLoginRequired } = useContext(LoginContext);
  const api = useMemo(() => new cls(onLoginRequired), [cls, onLoginRequired]);
  return api;
};

