import { useCallback, useEffect, useState } from 'react';
import { api, errMsg } from '../api/client';


export default function useFetch(url, params) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const key = JSON.stringify(params || {});

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const { data } = await api.get(url, { params: JSON.parse(key) });
      setState({ data, loading: false, error: '' });
    } catch (e) {
      setState({ data: null, loading: false, error: errMsg(e) });
    }
  }, [url, key]);

  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
