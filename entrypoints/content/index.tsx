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
        if (shadowHost) {
          shadowHost.style.position = 'fixed'
          shadowHost.style.right = `-100vw`
          shadowHost.style.top = '0px'
          shadowHost.style.zIndex = '2147483647'
          shadowHost.style.transitionProperty = 'all'
          shadowHost.style.transitionTimingFunction = 'cubic-bezier(0.4, 0, 0.2, 1)'
          shadowHost.style.transitionDuration = '300ms'
        }

        container.style.visibility = 'visible'

        const app = document.createElement('div')
        container.append(app)

        const root = ReactDOM.createRoot(app)
        root.render(
          <UtilityContextProvider>
            <App
              container={container}
              shadow={shadow}
              shadowHost={shadowHost}
            />
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
