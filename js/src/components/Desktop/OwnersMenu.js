import React, { useState, useCallback, useEffect } from 'react';
import _JSXStyle from "styled-jsx/style";
import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { TSL } from '../../lib/trackList';

export const OwnersMenu = () => {
  const api = useAPI(API);
  const [users, setUsers] = useState([]);
  const [owner, setOwner] = useState(null);
  useEffect(() => {
    if (api) {
      api.listUsers().then(setUsers);
    }
  }, [api]);
  const onChange = useCallback((evt) => {
    setOwner(evt.target.value || null);
  }, []);
  useEffect(() => {
    if (owner) {
      TSL.filterOwner([owner]);
    } else {
      TSL.filterOwner([]);
    }
  }, [owner]);
  return (
    <select className="ownersMenu" value={owner} onChange={onChange}>
      <option value="">All</option>
      <option disabled>{'\u2014'.repeat(8)}</option>
      {users.map((user) => (
        <option key={user.persistent_id} value={user.persistent_id}>{`${user.first_name} ${user.last_name} (${user.username})`}</option>
      ))}
      <style jsx>{`
        .ownersMenu {
          outline: none;
          font-size: 12px;
          padding: 2px;
          color: var(--highlight);
        }
      `}</style>
    </select>
  );
};

export default OwnersMenu;
