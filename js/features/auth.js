import {emit} from '../core/bus.js';
import {esc} from '../core/utils.js';
import {Cloud} from '../storage/cloud.js';

let mode='signin',email='';

export function authView(){
  const signup=mode==='signup',configured=Cloud.configured;
  return `<div class="auth-page"><div class="auth-shell">
<img class="auth-logo" src="assets/images/logo.png" alt="What 2 Do">
<section class="auth-card" aria-labelledby="auth-title">
<p class="auth-eyebrow">${signup?'GET STARTED':'WELCOME BACK'}</p>
<h1 id="auth-title">${signup?'Create your account':'Sign in'}</h1>
<p class="auth-copy">${signup?'Create an account to keep your planner in sync across devices.':'Sign in to pick up where you left off on any device.'}</p>
<form id="cloud-form">
<label class="f"><span>Email</span><input class="in" type="email" name="email" value="${esc(email)}" autocomplete="username" required></label>
<label class="f"><span>Password</span><input class="in" type="password" name="password" autocomplete="${signup?'new-password':'current-password'}" minlength="8" required></label>
<button class="btn pri auth-submit" type="submit" name="cloud-action" value="${signup?'signup':'signin'}" ${configured?'':'disabled'}>${signup?'Create account':'Sign in'}</button>
<div class="err auth-status" data-cloud-status role="status">${esc(Cloud.status)}</div>
</form>
${configured?'':`<div class="auth-unavailable" role="status"><b>Accounts aren’t connected yet</b><span>Add the Supabase project URL and publishable key in <code>js/core/cloud-config.js</code> to enable sign-in.</span></div>`}
<p class="auth-switch">${signup?'Already have an account?':'New to What 2 Do?'} <button type="button" data-auth-mode="${signup?'signin':'signup'}">${signup?'Sign in':'Create an account'}</button></p>
</section>
<p class="auth-note">Your account keeps your events, tasks, and diary private and synced.</p>
</div></div>`;
}

export function bindAuth(){
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-auth-mode]');
    if(!button)return;
    const input=document.querySelector('#cloud-form [name="email"]');
    if(input)email=input.value;
    mode=button.dataset.authMode;
    emit('render');
  });
}
