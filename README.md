# OpenReply
OpenReply is a service that lets people comment on any website on the world. We deliver this service through the browser extension that embeds a comment section on every website, and a webapp that lets people enter a URL and access its comment section. Think of it like Reddit but for the internet.

This repository contains all the code relevant to the browser extension, and the associated backend services.

# Important Links
- 🎨 **[Figma](https://www.figma.com/design/zMCbIBF0KdTQKrToh91qKB/OpenReply-Extension-UI)**
- ✍️ **[Notion](https://www.notion.so/team/31f1711e-238e-4426-b931-00bba1ee12f6/join)**

# Table Of Contents
- **[Tech Stack](#tech-stack)**
- **[Structure](#structure)**
  - **[Content Script](#content-script)**
  - **[Background Script](#background-script)**
- **[How It Works](#how-it-works)**
  - **[Comments](#comments)**
  - **[Websites](#websites)**
  - **[Feed](#feed)**

# Tech Stack
- **Framework**: [WXT](https://wxt.dev) and [React](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [Firebase Realtime Database](https://firebase.google.com/docs/database) and [Firestore](https://firebase.google.com/docs/firestore)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)*
- **API**: [Firebase Functions](https://firebase.google.com/docs/functions)
- **Metrics**: *N/A*

\* = `auth.signInWithPopup` is broken with the introduction of [MV3](https://medium.com/@official.boomconsole/manifest-v2-vs-manifest-v3-in-browser-extensions-1779c6902da6), instead we're using `browser.identity.launchWebAuthFlow` with `GoogleAuthProvider.credential` (Credit: [Jed's comment](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/xQmZLc8cu6Q/m/13noLGbhAQAJ)). You are encouraged to [read more](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/xQmZLc8cu6Q) about this issue.

# Structure
The extension is built with the [WXT Framework](https://wxt.dev). Broadly, there are two entrypoints:
- 🖼️ **[Content Script](#content-script)**
- 🧠 **[Background Script](#background-script)**

## Content Script
The content script is the code that runs inside the webpage. OpenReply uses the [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) to render a [Custom Element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) containing the React WebApp. This approach is different from directly injecting the React code into the webpage - which will introduce conflicts with styles and classes, or rendering the React WebApp inside an HTML iframe - in which case we won't be able to access the current page's context. You are encouraged to study the pros and cons of the various approaches [here](https://wxt.dev/guide/key-concepts/content-script-ui.html).

One of the notable downsides of using WXT's Shadow Root approach for building the Content Script UI is that there is not Hot Module Replacement (HMR) in place. This makes development somewhat tedious and blackboxed.

The UI is built with **TailwindCSS** and **shadcn/ui** components. All the UI designs are present **[in this Figma file](https://www.figma.com/design/zMCbIBF0KdTQKrToh91qKB/OpenReply-Extension-UI)**. Check out the documentation for the pages [here](/entrypoints/content/pages/README.md).

## Background Script
The background script is a script (for MV2) or a service worker (MV3) that - you guessed it - runs in the background. It's a long-running script that stays active for the entire time the browser is open, even when the extension's user interface is not visible, and thus it is ideal for event handling, state management, and calling APIs. [Read more](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Background_scripts).

You can also check out about how WXT handles the background page [here](https://wxt.dev/guide/directory-structure/entrypoints/background.html).

The background script handles the following:
- **Calling APIs**: Reading data from database (either **Realtime Database** or **Firestore**), and writing to it (through **Firebase Functions**).
- **Authentication**: Handling authentication, maintaining the auth state, and sending events to content scripts when the auth state mutates.
- **Offline Storage**: Caching data locally with **[localforage](https://github.com/localForage/localForage)**.

# How It Works
In this section, we'll introduce you to the logical components behind OpenReply, and how they interoperate with each other.

## Comments
Comments are the most important primitive in OpenReply for since they contain socially-important and nuanced information. Uncensored opinions from people with varying experiences is fundamentally valuable to an individual in their search for the truth about a particular subject. **This is how humans are supposed to function**.

However, the caveat to this is that the opinions should try their best to be free of offensive speech. **All opinions are welcome**, no matter how radical, as long as they are worded politely and resemble an actual conversation that people would have in the real world.

To achieve this goal, we check all comments for offensive feed *before* they are posted (OpenReply notifies the user if the comment they're about to post contains offensive speech, and what they can do to re-word their comment for politeness).

![Offensive comment detected prior to posting](./public/images/offensive-comment-detected.png)

*After* a comment is posted, we don't downrank it for offensiveness, but readers have options to manage offensive speech.

![Readers can choose how to deal with offensive content](./public/images/sensitive-content-moderation.png)

If the reader has chosen to blur unsafe comments, this is how they will appear.

![Comments with unsafe content appear like this when blurred](./public/images/unsafe-content-blurred.png)

Additionally, being able to comment on any website and read others' comments is cool - but it'd be cooler would be if I could discover similar comments and websites aligned with my interests. Content discovery adds value to the user's experience, there are a lot of really interesting and relevant comments left by other users on websites I might never get to know about - unless it showed up on my **[Feed](#feed)**. 

## Websites
🚧 In progress

## Feed
🚧 In progress
