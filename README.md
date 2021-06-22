# What Is OpenReply?
OpenReply is a browser extension that lets you review websites, meet new friends, and lets your ideas be heard. It acts like a virtual layer over the internet.

# Downloads
You can download the OpenReply extension on the [Chrome WebStore](https://chrome.google.com/webstore/detail/openreply/noljkklhldpabidacigodpiiimjgodfk).

## Project Overview
Here's a quick overview of the project structure.
```
- config [ ⚛ Config files for React-Webpack-Jest ]
+ public [ 🖼 Public assets ]
  + app
    - background.html [ 📄 Background page for the extension ]
    - background.js [ 🧠 Background script that contains all of the business logic. This might be removed with Manifest V3 ]
  - css
  - icons
  - favicon.ico
  - index.html [ 📄 Content page for the extension content scripts ]
  - manifest.json
- scripts
+ src
  - assets [ 🎞 Images and icons ]
  + components [ 🔮 Components for global and views ]
    + global
      - AlertFooter
      - Navbar
      - Vote
    - views
      - Home
        - Comment
        - Comments
        - Head
        - Replies
        - Reply
  + constants
    - auth [ 📚 Constants for auth operations ]
    - bucket [ 📚 Constants for storage bucket operations ]
    - database [ 📚 Constants for database operations ]
    - index.js
    - user.js
    - view.js
    - voting.js
  + firebase
    - config.js [ 🔥 Configuration file for Firebase ]
  + hooks [ ⚡ Custom hooks]
    - auth [ 🔐 Manages all auth related functions ]
    - bucket [ 🌊 Manages all bucket related functions ]
    - database [ 💾 Manages all database related functions ]
    - use-input.jsx [ 🎮 Simple hook to handle user input ]
    - use-timeout.jsx [ ⏲ Implements setTimeout ]
  - media [ 📸 Media folder that is copied over during build phase ]
  + redux [ 🗿 State management ]
    - action-types [ 💪🏻 Action Type constants ]
    - actions [ 💪🏻 Pure functions that implement an action on the state ]
    - reducers [ 🔨 Intercepts actions and changes state ]
    - store [ 🛒 Store initialization ]
  - routes [ 🚕 Routes for the SPA ]
  - styles [ 💅 Global styles and colors ]
  + util [ ✨ Functions that implement certain utilities ]
    - auth [ 🔐 Functions that support auth operations ]
    - copyAssets [ 📰 Copies over assets during build phase ]
    - generateAction [ 🏓 Action generator for spam filter (DISCONTINUED) ]
    - getDataURL [ 📜 Converts image files to Base64 URIs ]
    - getLocalFavicon [ 🌺 Gets favicon ICO for the current page being indexed ]
    - is-profane [ 🎈 Checks for profanity ]
    - kirak32 [ 🆔 Cryptographic avalanche algorithm that generates unsafe pseudorandom unique IDs based on URL string. Collisions might be an issue in the future ]
    - nl2br [ 🖇 Converts \n and \r\n to <br/> ]
    - supertrunc [ ✂ Truncates paragraph strings ]
    - url-sanitize [ 🧼 Sanitizes URLs to be indexed ]
  + views
    - Home [ 👋 Comments page ]
    - Login [ 🔑 Login page ]
    - Profile [ 👨‍🦱 Profile page ]
    - Register [ 🌌 Registration page ]
  - App.jsx
  - content.js
  - index.js
```

## Code Overview
Additionally, all .js and .jsx files in this project follow the convention below.
```
  🎁 Packages [ Importing all necessary packages ]
  💙 Typescript [ Importing all Typescript dependencies ]
  🌠 Imports [ Importing all necessary assets ]
  📚 Constants [ Importing/Declaring all necessary constants ]
  🔮 Components [ Importing/Creating all necessary components ]
  🗿 Redux [ Importing all necessary Redux functions. DISCONTINUED: useSelector, useDispatch used instead ]
  🍜 Variables [ Declaring all necessary variables ]
  💅 Styles [ Declaring all necessary styles ]
  ✨ Functions [ Declaring all necessary functions ]
  🎯 PropTypes [ Declaring PropTypes. DISCONTINUED: Interfaces for props declaration used instead. ]
  💡 Exports [ Exporting all necessary elements ]
```

# Function Return
All non-React, non-Redux pure functions return a **Response Object**, the Typescript declaration is described below.
```ts
const RESULTS = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
};

type TRESULT = typeof RESULTS.FAILURE | typeof RESULTS.SUCCESS;

interface IError {
  code: string;
  message: string;
};

interface IResponse {
  result: TRESULT;
  payload: IError | null | any;
}; 
```
This implies that any function return can be destructured as ```const { result, payload } = await someFunction();``` with the ```result``` being either **"SUCCESS"** or **"FAILURE"** and the ```payload``` being ```null```, ```any```, or an **Error Object**. **Error Objects** contain a ```code``` (an internal signature of the error) and a ```message``` (a user presentable string describing the error).

# Code Philosophy
0. Order of quotes: ' > " > `
1. Atomization and localization: Separate all working parts into individual files (as much as is convenient) and localize them. Global elements are to be avoided unless the benefits outweigh the harms.

# Contributing
Fork and play around.

# Pending Tasks
0. Add CHANGELOG.md to help document changes. ✅
1. Add CONTRIBUTING.md to help new contributors.
2. Port to Firefox, Opera, etc.
3. Update build configuration to use TypeScript instead.