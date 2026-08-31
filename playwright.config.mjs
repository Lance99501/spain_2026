import {defineConfig,devices} from '@playwright/test';

const baseURL='http://127.0.0.1:4173';

export default defineConfig({
  testDir:'./tests/browser',
  globalSetup:'./tests/support/global-setup.mjs',
  fullyParallel:true,
  forbidOnly:Boolean(process.env.CI),
  retries:process.env.CI?2:0,
  workers:process.env.CI?1:undefined,
  reporter:process.env.CI
    ? [['line'],['html',{open:'never'}]]
    : 'list',
  use:{
    baseURL,
    screenshot:'only-on-failure',
    trace:'retain-on-failure'
  },
  projects:[
    {
      name:'chromium',
      use:{...devices['Desktop Chrome']}
    }
  ]
});
