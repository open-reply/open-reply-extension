import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  alias: {
    'types': './types',
    'constants': './constants',
    'utils': './utils'
  },
  manifest: {
    permissions: ['storage', 'activeTab', 'identity'],
    name: 'OpenReply',
    short_name: 'OpenReply',
    description: 'OpenReply is a browser extension that lets you review websites, meet new friends, and have your ideas heard.',
    version: '0.1.0',
    author: 'OpenReply',
    action: {},
    page_action: {},
    commands: {
      'toggle-open-reply': {
        suggested_key: {
          default: 'Alt+O'
        },
        description: 'Toggle OpenReply.'
      },
    },
    host_permissions: ['<all_urls>'],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
      sandbox: "sandbox allow-scripts allow-forms allow-popups allow-modals; script-src 'self' 'unsafe-inline' 'unsafe-eval'; child-src 'self';"
    },
    // @ts-ignore
    oauth2: {
      client_id: '217460725135-d9hnpab6pc6p224sfsu2j516ju9o5vms.apps.googleusercontent.com',
      scopes: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    }
  },
});
