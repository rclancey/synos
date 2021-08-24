import React, { useState, useEffect, useCallback, useContext } from 'react';
import _JSXStyle from "styled-jsx/style";
import zxcvbn from 'zxcvbn';

import LoginContext from '../../../context/LoginContext';
import { useAPI } from '../../../lib/useAPI';
import { API } from '../../../lib/api';
import { Dialog } from '../Dialog';
import Button from '../../Input/Button';
import { TwoFactor } from './TwoFactor';

const PasswordStrength = ({ value, size = 100 }) => {
  if (!value) {
    return null;
  }
  const strength = zxcvbn(value || '');
  let color = '#f00';
  let end = 10;
  switch (strength.score) {
    case 0:
      color = '#f00';
      end = 10;
      break;
    case 1:
      color = '#f00';
      end = 25;
      break;
    case 2:
      color = '#f90';
      end = 45;
      //chr = ' \u{10102}';
      break;
    case 3:
      color = '#0f0';
      end = 65;
      break;
    case 4:
      color = '#0f0';
      end = 85;
      break;
    case 5:
      color = '#0f0';
      end = 99;
      break;
    default:
      color = '#000';
      end = 0;
      //chr = ' \u2714';
      break;
  }
  return (
    <span className="meter">
      <span className="fill" />
      <style jsx>{`
        .meter {
          display: block;
          width: ${size}px;
          height: 6px;
          box-sizing: border-box;
          border: solid var(--border) 1px;
          border-radius: 10px;
        }
        .fill {
          display: block;
          width: ${size - 2}px;
          height: 4px;
          background: linear-gradient(90deg, ${color} 0%, ${color} ${end}%, var(--gradient-end) ${end}%);
        }
      `}</style>
    </span>
  );
};

const TextField = ({ type = 'text', obj, field, autocomplete = 'off', onInput, ...props }) => (
  <input
    type={type}
    value={obj[field] || ''}
    autocomplete={autocomplete}
    onInput={(evt) => onInput({ ...obj, [field]: evt.target.value })}
    {...props}
  >
    <style jsx>{`
      input {
        background: var(--gradient-end);
        color: var(--text);
        border: solid var(--border) 1px;
        border-radius: 4px;
        padding: 2px 6px;
        box-sizing: border-box;
      }
      input:focus-visible {
        outline: var(--highlight) auto 1px;
      }
    `}</style>
  </input>
);

const social = [
  "Apple",
  "GitHub",
  "Google",
  "Amazon",
  "Facebook",
  "Twitter",
  "LinkedIn",
  "Slack",
  "BitBucket",
];

export const UserInfo = ({ admin = false, user, onClose }) => {
  const api = useAPI(API);
  const { username } = useContext(LoginContext);
  const [editing, setEditing] = useState(user);
  const [auth, setAuth] = useState({});
  const [twoFactor, setTwoFactor] = useState(false);
  useEffect(() => {
    setEditing(user);
    setAuth({});
  }, [user]);
  const onSave = useCallback(() => {
    if (auth.password !== auth.confirm) {
      return;
    }
    if (user.persistent_id) {
      api.editUser(editing).then(onClose);
    } else {
      api.createUser({ ...editing, auth: { password: auth.password } }).then(onClose);
    }
  }, [api, editing]);
  const onOpenTwoFactor = useCallback(() => setTwoFactor(true), []);
  const onCloseTwoFactor = useCallback(() => setTwoFactor(false), []);
  if (twoFactor) {
    return (<TwoFactor onClose={onClose} />);
  }
  return (
    <Dialog
      title={user.persistent_id ? 'Edit User' : 'Create User'}
      style={{
        left: 'calc(50vw - 400px)',
        top: '100px',
        width: '800px',
        maxHeight: '80vh',
      }}
    >
      <table className="userinfo">
        <style jsx>{`
          .userinfo {
            margin-left: auto;
            margin-right: auto;
            font-size: 14px;
          }
          td {
            white-space: nowrap;
            width: min-content;
            padding-left: 0.5em;
            padding-right: 0.5em;
          }
          td.key {
            text-align: right;
            padding-right: 0.5em;
          }
          td.buttons {
            text-align: center;
          }
          .userinfo :global(input) {
            width: 160px;
          }
          .userinfo :global(input.error) {
            border-color: red !important;
            color: red !important;
            background: #fcc !important;
          }
          .userinfo :global(input[type="url"]) {
            width: 500px;
          }
          .userinfo :global(input[type="checkbox"]) {
            width: auto;
          }
        `}</style>
        <tbody>
          <tr>
            <td className="key">Username:</td>
            <td>
              {user.persistent_id ? user.username : (
                <TextField obj={editing} field="username" autocomplete="new-password" onInput={setEditing} />
              )}
            </td>
            {user.persistent_id ? (
              <>
                <td className="key">ID:</td>
                <td>{user.persistent_id}</td>
              </>
            ) : null}
          </tr>
          {admin || !user.persistent_id ? (
            <>
              <tr>
                <td className="key">Password:</td>
                <td>
                  <TextField type="password" obj={auth} field="password" autocomplete="new-password" onInput={setAuth} />
                </td>
                <td className="key">Confirm:</td>
                <td>
                  <TextField
                    type="password"
                    obj={auth}
                    field="confirm"
                    autocomplete="new-password"
                    onInput={setAuth}
                    className={auth.password === auth.confirm ? 'ok' : 'error'}
                  />
                </td>
              </tr>
              <tr>
                <td></td>
                <td><PasswordStrength value={auth.password} size={160} /></td>
              </tr>
            </>
          ) : null}
          {user.username === username ? (
            <tr>
              <td className="key" />
              <td colSpan={3}>
                <Button onClick={onOpenTwoFactor}>Setup Two Factor Authentication</Button>
              </td>
            </tr>
          ) : null }
          <tr>
            <td className="key">First Name:</td>
            <td><TextField obj={editing} field="first_name" onInput={setEditing} /></td>
            <td className="key">Last Name:</td>
            <td><TextField obj={editing} field="last_name" onInput={setEditing} /></td>
          </tr>
          <tr>
            <td className="key">Email Address:</td>
            <td><TextField type="email" obj={editing} field="email" onInput={setEditing} /></td>
            <td className="key">Phone Number:</td>
            <td><TextField type="tel" obj={editing} field="phone" onInput={setEditing} /></td>
          </tr>
          <tr>
            <td className="key">Avatar:</td>
            <td colSpan={3}>
              <TextField
                type="url"
                obj={editing}
                field="avatar_url"
                placeholder="https://www.gravatar/avatar/abcdef12345"
                size={80}
                onInput={setEditing}
              />
            </td>
          </tr>
          {social.map((provider, i) => (i % 2 === 0 ? (
            <tr key={provider}>
              <td className="key">{provider}{' ID:'}</td>
              <td><TextField obj={editing} field={`${provider.toLowerCase()}_id`} onInput={setEditing} /></td>
              { social[i+1] ? (
                <>
                  <td className="key">{social[i+1]}{' ID:'}</td>
                  <td><TextField obj={editing} field={`${social[i+1].toLowerCase()}_id`} onInput={setEditing} /></td>
                </>
              ) : null }
            </tr>
          ) : null))}
          <tr>
            <td className="key">Admin:</td>
            <td>
              <input
                type="checkbox"
                value="true"
                checked={editing.admin}
                onClick={() => setEditing({ ...editing, admin: !editing.admin })}
              />
            </td>
          </tr>
          <tr>
            <td className="buttons" colSpan={4}>
              <Button onClick={onSave}>{user.persistent_id ? 'Update' : 'Create'}</Button>
              <Button type="secondary" onClick={onClose}>Cancel</Button>
            </td>
          </tr>
        </tbody>
      </table>
    </Dialog>
  );
};

export const UserAdmin = ({ onClose }) => {
  const { userinfo } = useContext(LoginContext);
  const api = useAPI(API);
  const [userlist, setUserlist] = useState([]);
  const [user, setUser] = useState(null);
  const onUserOpen = useCallback((username) => {
    api.getUser(username).then(setUser);
  }, [api]);
  const onUserClose = useCallback(() => {
    if (userinfo.admin) {
      api.listUsers().then((xusers) => {
        setUserlist(xusers);
        setUser(null);
      });
    } else {
      onClose();
    }
  }, [api, userinfo]);
  useEffect(() => {
    if (userinfo.admin) {
      api.listUsers().then(setUserlist);
    } else {
      api.getUser(userinfo.username).then(setUser);
    }
  }, [api, userinfo]);
  if (user !== null) {
    return (<UserInfo admin={userinfo.admin} user={user} onClose={onUserClose} />);
  }
  return (
    <Dialog
      title="User Admin"
      style={{
        left: 'calc(50vw - 400px)',
        top: '100px',
        width: '800px',
        maxHeight: '80vh',
      }}
    >
      <div className="userlist">
        <style jsx>{`
          .userlist table {
            width: 100%;
            border-spacing: 0px;
            font-size: 14px;
          }
          .userlist th, .userlist td {
            font-size: 14px;
            color: var(--text);
            padding: 0px;
          }
          .userlist table thead th {
            text-align: left;
            border-bottom: solid var(--border) 1px;
          }
          .userlist table tbody tr:nth-child(2n) {
            background-color: var(--contrast2);
          }
          .userlist td.id {
            cursor: pointer;
          }
          .userlist p.center {
            text-align: center;
          }
        `}</style>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {userlist.map((xuser) => (
              <tr key={xuser.persistent_id}>
                <td className="id" onClick={() => onUserOpen(xuser.username)}>{xuser.persistent_id}</td>
                <td>{xuser.username}</td>
                <td>{xuser.first_name}</td>
                <td>{xuser.last_name}</td>
                <td onClick={() => onDeleteUser(xuser.username)}>Delete</td>
              </tr>
            ))}
            <tr>
              <td className="id" colSpan={5} onClick={() => setUser({})}>+ Create User</td>
            </tr>
          </tbody>
        </table>
        <p className="center">
          <Button type="secondary" onClick={onClose}>Cancel</Button>
        </p>
      </div>
    </Dialog>
  );
};
