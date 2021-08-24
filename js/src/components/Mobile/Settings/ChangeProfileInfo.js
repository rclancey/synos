import React, { useMemo, useState, useEffect, useCallback, useContext } from 'react';
import _JSXStyle from 'styled-jsx/style';

import { API } from '../../../lib/api';

const parsePhone = (phone) => {
  console.debug('parsePhone(%o %o)', typeof phone, phone);
  if (phone === null || phone === undefined) {
    return { raw: '' };
  }
  try {
  let rem = phone;
  const country = '+1';
  rem = rem.replace(/^\s*\+?1\s*/, '');
  let m = rem.match(/^\D*(\d{3})/);
  const area = m ? m[1] : '';
  rem = rem.replace(/^\D*\d{3}/, '');
  m = rem.match(/^\D*(\d{3})/);
  const prefix = m ? m[1] : '';
  rem = rem.replace(/^\D*\d{3}/, '');
  m = rem.match(/^\D*(\d{4})/);
  const num = m ? m[1] : '';
  return {
    raw: phone,
    country,
    area,
    prefix,
    num,
  };
  } catch (err) {
    console.error('parsePhone(%o) => %o', phone, err);
    return { raw: phone };
  }
};

const formatPhone = (phone) => {
  const {
    raw,
    country,
    area,
    prefix,
    num,
  } = parsePhone(phone);
  if (!country || !area || !prefix || !num) {
    return raw;
  }
  return `${country} (${area}) ${prefix}-${num}`;
};

const simplifyPhone = (phone) => {
  const {
    raw,
    country,
    area,
    prefix,
    num,
  } = parsePhone(phone);
  if (!country || !area || !prefix || !num) {
    return raw;
  }
  return `${country}${area}${prefix}${num}`;
};

export const ChangeProfileInfo = () => {
  const api = useMemo(() => new API(), []);
  const [userinfo, setUserinfo] = useState({});
  const [dirty, setDirty] = useState(false);
  const onChange = useCallback((evt) => {
    setUserinfo((orig) => ({ ...orig, [evt.target.name]: evt.target.value }));
    setDirty(true);
  }, []);
  const onChangePhone = useCallback((evt) => {
    setUserinfo((orig) => ({ ...orig, phone: simplifyPhone(evt.target.value) }));
    setDirty(true);
  }, []);
  const onSave = useCallback(() => {
    api.post(`/api/admin/user/${userinfo.username}`, userinfo)
      .then((resp) => {
        setUserinfo(resp);
        setDirty(false);
      });
  }, [api, userinfo]);
  useEffect(() => {
    api.get(`/api/admin/user/__myself__`)
      .then((resp) => {
        setUserinfo(resp);
        setDirty(false);
      });
  }, []);

  return (
    <>
      <div>Name:</div>
      <div>
        <input
          type="text"
          name="first_name"
          size="12"
          value={userinfo.first_name}
          placeholder="First"
          onChange={onChange}
        />
        <input
          type="text"
          name="last_name"
          size="15"
          value={userinfo.last_name}
          placeholder="last"
          onChange={onChange}
        />
      </div>
      <div>Email:</div>
      <div>
        <input
          type="email"
          name="email"
          size="30"
          value={userinfo.email}
          placeholder="username@domain.com"
          onChange={onChange}
        />
      </div>
      <div>Phone:</div>
      <div>
        <input
          type="tel"
          name="phone"
          size="30"
          value={formatPhone(userinfo.phone)}
          placeholder="+1 (310) 777-3456"
          onChange={onChangePhone}
        />
      </div>
      <div />
      <div>
        <button disabled={!dirty} onClick={onSave}>Update</button>
      </div>
    </>
  );
};

export default ChangeProfileInfo;
