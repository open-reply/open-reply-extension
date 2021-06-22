
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [v0.3.2] - 🌺 Dwarka Update - 2021-06-22
### Added
- Added `databaseUser` to `hooks/database` to facilitate `updateBabyMode`.
- Added undefined checks in `hooks/database` and `background.js`.
### Changed
- Updated `voteURL` to include `title`, `favicon`, and `totalSentiment`.
- Changed `"` to `'` in the `COLORS` import statement in `constants/index.js`.
- Updated calls to `updateUserObject` in `deleteComment` and `deleteReply` to properly reflect changes.
- Updated `CHANGELOG.md` to add horizontal bars between version bumps and added `v` in front of version strings.
### Removed
- Removed Discord invite link from `README.md`.
---
## [v0.3.1] - 🪔 Varanasi Update - 2021-06-16
### Added
- Added folder `media` which is copied over to `build/static` during compilation.
### Changed
- Fixed Profile UI.
- Fixed comment not being added to the userObject array.
- Fixed website quota issue when commenting.
---
## [v0.3.0] - 2021-06-16
### Added
- Added quota levels to help beat spam.
### Changed
- Updated to use Redux hooks.
- Updated the userObject greatly to track user's comments, replies and votes.
---
## [v0.2.1] - 2021-01-10
### Changed
- Firebase Storage saves profile pictures to `UID/profilePicture.format` and not `username/profilePicture.format`.
- Updated Firebase Firestore `users/USERNAME` documents to contain `UID`.
---
## [v0.2.0] - 2021-01-09
### Added
- CTA bubble that appears by default on every website, which can be disabled both ephemerally and permanently. This requires setting an object in `chrome.storage.sync` which is not standardised and should be expected to fall under an options object in future releases.
- UID field to Redux's `DEFAULT_AUTH_USER` object.
- User friendly login error prompts.
- User friendly loading screen when uploading new profile picture. It still lacks a prompt and/or a hover overlay, which may be added in future releases.
### Changed
- Shifted all Firebase API functions to background.js to maintain `AUTH_STATE` during READ/WRITE operations that require `request.auth !== null`.
- Updated permissions required in `manifest.json` to only include `[ "storage", "<all_urls>" ]` only.
- Strengthened Firebase Firestore and Firebase Database Security Rules since `request.auth !== null`.
- Updated some UI components to use absolute `px` rather than `em` values to deal with big UI issue on large screens.
- Fixed an upvote/downvote exploit on URL, comment and reply voting using debouncers and a (non-uniform) vote object state that should be made uniform in the future.
### Removed
- Redux `connect` functions in some components with modern Redux hooks `useSelector` and `useDispatch`. All Redux-dependant components will be shifted to hooks in future releases.
---
## [v0.1.0] - 2014-05-31
### Added
- Genesis.

[v0.3.2]: https://github.com/open-reply/open-reply-extension
[v0.3.1]: https://github.com/open-reply/open-reply-extension/commit/511628fbfb5e7e0875f07d09e18f9bfd26c8d56a
[v0.3.0]: https://github.com/open-reply/open-reply-extension/commit/56decda588bda4307a9620f5de297799d35cf432
[v0.2.1]: https://github.com/open-reply/open-reply-extension/commit/929f046a56f80cae6d7765437da0c95a693590d3
[v0.2.0]: https://github.com/open-reply/open-reply-extension/commit/ff0651e5e4d9e15a0361fd848668df230a4600e3
[v0.1.0]: https://github.com/open-reply/open-reply-extension/commit/595d7d82dd3b3118fd7f2265c355c83cbd1098ed