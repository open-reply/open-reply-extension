// Packages:
import ReactDOM from 'react-dom/client'

// Components:
import App from './App'

// Exports:
export default defineContentScript({
  matches: ['<all_urls>'],
  main: ctx =>  {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: 'body',
      onMount: container => {
        // Don't mount react app directly on <body>
        const wrapper = document.createElement("div")
        container.append(wrapper)

        // Create a root on the UI container and render a component
        const root = ReactDOM.createRoot(wrapper)
        root.render(<App />)
        return { root, wrapper }
      },
      onRemove: elements => {
        elements?.root.unmount();
        elements?.wrapper.remove();
      },
    })

    // Call mount to add the UI to the DOM
    ui.mount()
  },
})
