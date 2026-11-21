import test from 'node:test';
import assert from 'node:assert/strict';
import {CLOUD_CONFIG} from '../js/core/cloud-config.js';
import {authView} from '../js/features/auth.js';

test('signed-out screen renders sign-in and create-account controls', () => {
  const config={...CLOUD_CONFIG};
  CLOUD_CONFIG.url='';
  CLOUD_CONFIG.anonKey='';
  try{
    const html=authView();
    assert.match(html,/id="cloud-form"/);
    assert.match(html,/name="email"/);
    assert.match(html,/name="password"/);
    assert.match(html,/value="signin"/);
    assert.match(html,/data-auth-mode="signup"/);
    assert.match(html,/Accounts aren’t connected yet/);
    assert.match(html,/disabled/);
  }finally{Object.assign(CLOUD_CONFIG,config)}
});
