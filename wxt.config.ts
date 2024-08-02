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
    permissions: ['storage', 'activeTab'],
    name: 'OpenReply',
    short_name: 'OpenReply',
    description: 'OpenReply is a browser extension that lets you review websites, meet new friends, and have your ideas heard.',
    version: '0.1.0',
    author: 'OpenReply',
    action: {},
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
    }
  },
});
