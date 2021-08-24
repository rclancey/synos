import React, { useMemo, useState, useEffect, useCallback, useContext } from 'react';
import _JSXStyle from 'styled-jsx/style';

import { API } from '../../lib/api';
import Button from '../Input/Button';
import TextInput from '../Input/TextInput';
import EmailInput from '../Input/EmailInput';
import PhoneInput from '../Input/PhoneInput';

export const ChangeName = ({ userinfo, onChange }) => (
  <div className="changeName">
    <TextInput
      name="first_name"
      value={userinfo.first_name}
      size={12}
      placeholder="First" 
      onInput={onChange}
    />
    <TextInput
      name="last_name"
      value={userinfo.last_name}
      size={16}
      placeholder="Last"
      onInput={onChange}
    />
  </div>
);

export const ChangeEmail = ({ userinfo, onChange }) => (
  <div className="changeEmail">
    <EmailInput
      name="email"
      value={userinfo.email}
      size={30}
      onInput={onChange}
    />
  </div>
);

export const ChangePhone = ({ userinfo, onChange }) => (
  <div className="changePhone">
    <PhoneInput
      name="phone"
      value={userinfo.phone}
      size={30}
      onInput={onChange}
    />
  </div>
);

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
    <div className="changeProfileInfo">
      <style jsx>{`
        .changeProfileInfo {
          display: grid;
          grid-template-columns: min-content auto;
          column-gap: 4px;
          row-gap: 10px;
        }
      `}</style>
      <div>Name:</div>
      <ChangeName userinfo={userinfo} onChange={onChange} />
      <div>Email:</div>
      <ChangeEmail userinfo={userinfo} onChange={onChange} />
      <div>Phone:</div>
      <ChangePhone userinfo={userinfo} onChange={onChange} />
      <div />
      <div>
        <Button disabled={!dirty} onClick={onSave}>Update</Button>
      </div>
    </div>
  );
};

export default ChangeProfileInfo;
