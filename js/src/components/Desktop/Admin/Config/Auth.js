import React, { Fragment, useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';

import { SubObject, TextInput, DurationInput, EmailInput, FilenameInput } from './Input';

/*
    AuthKey           string         `json:"key"                 arg:"key"`
    TTL               int            `json:"ttl"                 arg:"ttl"`
    Issuer            string         `json:"issuer"              arg:"issuer"`
    Cookie            string         `json:"cookie"              arg:"cookie"`
    Header            string         `json:"header"              arg:"header"`
    EmailSender       string         `json:"email_sender"        arg:"email-sender"`
    ResetTTL          int            `json:"reset_ttl"           arg:"reset-ttl"`
    ResetTemplate     TemplateConfig `json:"reset_template"      arg:"reset-template"`
    TwoFactorTemplate TemplateConfig `json:"two_factor_template" arg:"two-factor-template"`
    SocialLogin       map[string]*SocialLoginConfig `json:"social"`

type SocialLoginConfig struct {
    ClientID     string `json:"client_id"`
    ClientSecret string `json:"client_secret"`
}

type TemplateConfig struct {
    Text string `json:"text" arg:"text"`
    HTML string `json:"html" arg:"html"`
    SMS  string `json:"sms"  arg:"sms"`
}
*/

const templateParts = [
  ["text", "Plain Text Template"],
  ["html", "HTML Template"],
  ["sms", "SMS Template"],
];
export const Template = ({ cfg, name, onChange }) => (
  <div className="template">
    {templateParts.map((part) => (
      <Fragment key={part[0]}>
        <div className="input">
          <FilenameInput name={part[0]} size={40} cfg={cfg} onChange={onChange} />
        </div>
        <div className="label">{part[1]}</div>
      </Fragment>
    ))}
  </div>
);

const socialDriverParts = [
  ["client_id", "Client ID"],
  ["client_secret", "Client Secret"],
];

export const SocialLogin = ({ name, cfg, onChange }) => (
  <div className="template">
    <style jsx>{`
      /*
      .socialLogin {
        display: block;
        width: min-content;
      }
      .socialLogin .label {
        color: var(--text-disabled);
        font-size: 10px;
        margin-bottom: 8px;
      }
      */
    `}</style>
    {socialDriverParts.map((part) => (
      <Fragment key={part[0]}>
        <div className="input">
          <TextInput
            name={part[0]}
            size={80}
            cfg={cfg}
            onChange={onChange}
          />
        </div>
        <div className="label">{part[1]}</div>
      </Fragment>
    ))}
  </div>
);

const socialDrivers = [
  ['amazon', 'Amazon'],
  ['apple', 'Apple'],
  ['github', 'GitHub'],
  ['google', 'Google'],
  ['facebook', 'Facebook'],
  ['twitter', 'Twitter'],
  ['linkedin', 'LinkedIn'],
  ['slack', 'Slack'],
];

export const Social = ({ cfg, onChange }) => (
  <>
    <div className="header">Social Logins</div>
    {socialDrivers.map((driver) => (
      <Fragment key={driver[0]}>
        <div className="key">{driver[1]}:</div>
        <div className="value">
          <SubObject name={driver[0]} Comp={SocialLogin} cfg={cfg} onChange={onChange} />
        </div>
      </Fragment>
    ))}
  </>
);

export const Auth = ({ cfg, onChange }) => (
  <>
    <div className="header">Authentication</div>
    <div className="key">JWT Signing Key:</div>
    <div className="value">
      <TextInput
        name="key"
        size={60}
        cfg={cfg}
        onChange={onChange}
      />
    </div>
    <div className="key inline">Max Idle Time:</div>
    <div className="value inline">
      <DurationInput name="ttl" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">JWT Issuer:</div>
    <div className="value inline">
      <TextInput name="issuer" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">Cookie Name:</div>
    <div className="value inline">
      <TextInput name="cookie" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">Header Name:</div>
    <div className="value inline">
      <TextInput name="header" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key">Email Sender:</div>
    <div className="value">
      <EmailInput name="email_sender" size={40} cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">Reset Timeout:</div>
    <div className="value inline">
      <DurationInput name="reset_ttl" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key">Reset Templates:</div>
    <div className="value">
      <SubObject name="reset_template" Comp={Template} cfg={cfg} onChange={onChange} />
    </div>
    <div className="key">2FA Templates:</div>
    <div className="value">
      <SubObject name="two_factor_template" Comp={Template} cfg={cfg} onChange={onChange} />
    </div>
    <SubObject name="social" Comp={Social} cfg={cfg} onChange={onChange} />
  </>
);

export default Auth;
