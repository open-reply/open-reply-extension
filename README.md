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
- **[Concepts](#concepts)**
  - **[Comments](#comments)**
    - **[Philosophy](#philosophy)**
    - **[Checking For Offensive Speech](#checking-for-offensive-speech)**
    - **[Comment Ranking Algorithm](#comment-ranking-algorithm)**
      - **[Controversy Score](#controversy-score)**
      - **[Wilson Score Interval](#wilson-score-interval)**
    - **[Comment Recommendation Algorithm](#comment-recommendation-algorithm)**
    - **[Replying](#replying)**
    - **[Flagging Comments](#flagging-comments)**
  - **[Websites](#websites)**
    - **[Philosophy](#philosophy-1)**
    - **[Safety](#safety)**
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
The extension is built with the [WXT Framework](https://wxt.dev). There are two entrypoints:
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

# Concepts
In this section, we'll introduce you to the logical components behind OpenReply, and how they interoperate with each other.

## Comments
### Philosophy
Comments are the most important primitive in OpenReply for since they contain socially-important and nuanced information. Uncensored opinions from people with varying experiences is fundamentally valuable to an individual in their search for the truth about a particular subject. **This is how humans are supposed to function**.

However, the caveat to this is that the opinions should try their best to be free of offensive speech. **All opinions are welcome**, no matter how radical, as long as they are worded politely and resemble an actual conversation that people would have in the real world.

### Checking For Offensive Speech
To achieve this goal, we check all comments for offensive feed *before* they are posted (OpenReply notifies the user if the comment they're about to post contains offensive speech, and what they can do to re-word their comment for politeness).

![Offensive comment detected prior to posting](./public/images/offensive-comment-detected.png)

*After* a comment is posted, we don't downrank it for offensiveness, but readers have options to manage offensive speech.

![Readers can choose how to deal with offensive content](./public/images/sensitive-content-moderation.png)

If the reader has chosen to blur unsafe comments, this is how they will appear.

![Comments with unsafe content appear like this when blurred](./public/images/unsafe-content-blurred.png)

### Comment Ranking Algorithm
Comments are ranked according to two time-independent ranking algorithms:
- **[Controversy Score](#controversy-score)**
- **[Wilson Score Interval](#wilson-score-interval)**

#### Controversy Score
The Controversy Score Algorithm, originally implemented in [_sorts.pyx](https://github.com/reddit/reddit/blob/master/r2/r2/lib/db/_sorts.pyx), is useful for sorting comments according to the amount of controvery they garner. This is useful for finding contrarian opinions. It is computed as:

```math
\text{ControversyScore} = \begin{cases} 
0 & \text{if } \text{downvotes} \leq 0 \text{ or } \text{upvotes} \leq 0 \\[2ex]
(\text{upvotes} + \text{downvotes})^{\frac{\text{downvotes}}{\text{upvotes}}} & \text{if } \text{upvotes} > \text{downvotes} \\[2ex]
(\text{upvotes} + \text{downvotes})^{\frac{\text{upvotes}}{\text{downvotes}}} & \text{if } \text{upvotes} \leq \text{downvotes}
\end{cases}
```

#### Wilson Score Interval
The Wilson Score Interval Algorithmm originally implemented in [_sorts.pyx](https://github.com/reddit/reddit/blob/master/r2/r2/lib/db/_sorts.pyx), is useful for generating a time-independent popularity score for a comment.

The great thing about the confidence sort is that submission time is irrelevant (much unlike the hot sort or Hacker News’s ranking algorithm). Comments are ranked by confidence and by data sampling — i.e. the more votes a comment gets the more accurate its score will become. It is computed as:

```math
\text{WilsonScoreInterval} = \frac{
  \frac{\text{upvotes}}{\text{upvotes} + \text{downvotes}} + 
  \frac{1}{2(\text{upvotes} + \text{downvotes})} z^2 - 
  z \sqrt{\frac{\frac{\text{upvotes}}{\text{upvotes} + \text{downvotes}}
  (1 - \frac{\text{upvotes}}{\text{upvotes} + \text{downvotes}})}
  {\text{upvotes} + \text{downvotes}} + 
  \frac{z^2}{4(\text{upvotes} + \text{downvotes})^2}}
}{
  1 + \frac{1}{\text{upvotes} + \text{downvotes}} z^2
}
```

### Comment Recommendation Algorithm
Being able to comment on any website and read others' comments is cool - but it'd be cooler would be if people could discover similar comments and websites aligned with their interests. Content discovery adds value to the user's experience, because there are a lot of really interesting and relevant comments left by other users on websites we might never get to know about - unless it showed up on our **[Feed](#feed)**.

### Replying
Comments can be replied to by other users, but it's a single-threaded discussion unlike Reddit's replies which can continue to branch off ad infinitum. However, replies can be targeted at other replies by tagging the user who posted the first reply - this behavior is similar to Instagram's comment reply feature.

#### Flagging Comments
🚧 In progress

## Websites
### Philosophy
There are more than a billion websites out there, each with their own set of webpages. **[YouTube alone has 14bn public videos](https://www.theatlantic.com/technology/archive/2024/01/how-many-videos-youtube-research/677250/)**. Users are going to index websites through OpenReply's service, and we can't use the website URL as the key (inconsistent hash states, it can be too long, etc.). Instead, we use the SHA512 hash of the *URL* (defined as `window.location.host + window.location.pathname + window.location.search`) as the key.

This is a well-studied problem, and the probability of collisions are [astronomically low](https://crypto.stackexchange.com/questions/89558/are-sha-256-and-sha-512-collision-resistant). Also read: "**[Why not use BLAKE2b instead of SHA512?](https://www.reddit.com/r/BorgBackup/comments/18psos5/is_blake2_unnecessary_on_newer_cpus_ryzen)**"

### Safety
🚧 In progress

## Feed
🚧 In progress
