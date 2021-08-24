import React from 'react';
import _JSXStyle from 'styled-jsx/style';

export const SocialButton = ({ driver, background, border, color, logo, children }) => (
  <a href={`/api/login/social/${driver}`}>
    <style jsx>{`
      a {
        display: block;
        box-sizing: border-box;
        width: 100%;
        margin-top: 5px;
        padding: 0.5em;
        border: solid ${border || background} 1px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: bold;
        font-size: 18px;
        color: ${color};
        background: ${background};
      }
      a .logo {
        display: inline-block;
        margin-right: 1em;
        margin-left: 0.5em;
        width: 18px;
        height: auto;
        background-image: url(/assets/logos/${logo});
        background-repeat: no-repeat;
        background-position: center;
        background-size: 18px 18px;
      }
    `}</style>
    {logo.startsWith('fa-') ? (
      <span className={`fab ${logo}`} />
    ) : (
      <span className="logo">{'\u00a0'}</span>
    )}
    {children}
  </a>
);

export const GitHubButton = () => (
  <SocialButton
    driver="github"
    background="black"
    color="white"
    logo="github/logo.png"
  >
    Login with GitHub
  </SocialButton>
);

export const GoogleButton = () => (
  <SocialButton
    driver="google"
    background="white"
    color="black"
    logo="google/logo.svg"
  >
    Sign in with Google
  </SocialButton>
);

export const AmazonButton = () => (
  <SocialButton
    driver="amazon"
    background="linear-gradient(#ffe8aa, #f5c646)"
    color="black"
    border="#b38b22"
    logo="amazon/logo.svg"
  >
    Login with Amazon
  </SocialButton>
);

export const FacebookButton = () => (
  <SocialButton
    driver="facebook"
    background="#4267b2"
    color="white"
    logo="facebook/logo.png"
  >
    Login with Facebook
  </SocialButton>
);

export const AppleButton = () => (
  <SocialButton
    driver="apple"
    background="black"
    color="white"
    logo="apple/logo.svg"
  >
    Sign in with Apple
  </SocialButton>
);

export const TwitterButton = () => (
  <SocialButton
    driver="twitter"
    background="#1d9bf0"
    color="white"
    logo="twitter/logo.svg"
  >
    Sign in with Twitter
  </SocialButton>
);

export const SlackButton = () => (
  <SocialButton
    driver="slack"
    background="#4a154b"
    color="white"
    logo="slack/logo.svg"
  >
    Sign in with Slack
  </SocialButton>
);

export const LinkedInButton = () => (
  <SocialButton
    driver="linkedin"
    background="#2977c9"
    color="white"
    logo="linkedin/logo.svg"
  >
    Sign in with LinkedIn
  </SocialButton>
);

export const SocialLoginForm = () => (
  <div className="social">
    <GoogleButton />
    {/* <FacebookButton /> */}
    {/* <TwitterButton /> */}
    {/* <LinkedInButton /> */}
    {/* <AppleButton /> */}
    {/* <AmazonButton /> */}
    {/* <SlackButton /> */}
    <GitHubButton />
  </div>
);

export default SocialLoginForm;
