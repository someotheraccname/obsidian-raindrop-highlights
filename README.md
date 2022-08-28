This plugin aims to integrate bookmarks/highlights/tags from _raindrop.io_ (https://raindrop.io) with _Obsidian_ (https://obsidian.md).

## Get raindrop.io Token
For this extension you need an access token, for this you need to create an app in Raindrop's setting:
- in the *For Developers* section (https://app.raindrop.io/settings/integrations) click on + Create new app.
- set the app name, accept the Terms and Guidelines and click _Create_.
- click the newly created app
- in the bottom of the form click on *Create test token*.
- copy the created token.

## Setup
- install and enable this plugin in Obsidian
- generate *raindrop.io* auth token
- paste previously created *raindrop.io* auth token in **Plugin-Settings**
- change other plugin settings as required

## PKM Flow
- add bookmark to *raindrop.io*
- enhance bookmark by adding highlights, notes and tags using *raindrop.io*
- move bookmark into configured _raindrop.io_ input directory (default: *obsidian*)
- import bookmarks into _Obsidian_ using this plugin (periodically, or on demand). By default, these bookmarks are available in _Obsidian_ under _articles/YYYY/MM/DD_
- bookmarks are now moved into configured _raindrop.io_ destination directory (default: *raindrop*)

## Commands
- *Sync highlights*: use this command to import bookmarks from *raindrop.io* on demand
