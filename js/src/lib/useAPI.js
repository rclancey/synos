import { useMemo, useContext, useRef } from 'react';
import LoginContext from '../context/LoginContext';

const cache = {};

export const useAPI = (cls) => {
  const { onLoginRequired } = useContext(LoginContext);
  const api = useMemo(() => {
    let inst = cache[cls.name];
    if (!inst) {
      inst = new cls(onLoginRequired);
      cache[cls.name] = inst;
    } else {
      inst.onLoginRequired = onLoginRequired;
    }
    return inst;
  }, [cls, onLoginRequired]);
  /*
  const refs = useRef({ cls: null, onLoginRequired: null });
  const api = useMemo(() => {
    if (cls !== refs.current.cls) {
      console.error('api (%o) changing because class changed (%o => %o)', cls.name, refs.current.cls, cls);
    } else if (onLoginRequired !== refs.current.onLoginRequired) {
      console.error('api (%o) changing becuase onLoginRequired changed (%o => %o)', cls.name, refs.current.onLoginRequired, onLoginRequired);
    } else {
      console.error('api (%o) changing for no reason');
    }
    refs.current = { cls, onLoginRequired };
    return new cls(onLoginRequired);
  }, [cls, onLoginRequired]);
  */
  return api;
};
