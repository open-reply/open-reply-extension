// Packages:
import ReactDOM from 'react-dom/client'

// Imports:
import './style.css'

// Components:
import App from './App'

// Context:
import { UtilityContextProvider } from './context/UtilityContext'

// Exports:
export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  main: async ctx => {
    const ui = await createShadowRootUi(ctx, {
      name: 'open-reply',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      
      onMount: (container, shadow, shadowHost) => {
        const app = document.createElement('div')
        app.id = 'app'

        container.style.visibility = 'visible'
        container.append(app)

        const root = ReactDOM.createRoot(app)
        root.render(
          <UtilityContextProvider>
            <App />
          </UtilityContextProvider>
        )

        return root
      },
      onRemove: root => {
        root?.unmount()
      },
    })

    ui.mount()
  },
})
