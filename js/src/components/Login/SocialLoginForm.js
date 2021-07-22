import React from 'react';

export const SocialLoginForm = () => (
  <div className="social">
    <a href="/api/login/social/github" className="github">
      <span className="logo">{'\u00a0'}</span>
      Login with GitHub
    </a>
    <a href="/api/login/social/google" className="google">
      <span className="logo">{'\u00a0'}</span>
      Sign in with Google
    </a>
    <a href="/api/login/social/amazon" className="amazon">
      <span className="fab fa-amazon"/>
      Login with Amazon
    </a>
    {/*
    <a href="/auth/facebook" className="facebook">
      <span className="logo">{'\u00a0'}</span>
      Login with Facebook
    </a>
    */}
    {/*
    <a href="/auth/apple" className="apple">
      <span className="fab fa-apple"/>
      Sign in with Apple
    </a>
    */}
  </div>
);

export default SocialLoginForm;
