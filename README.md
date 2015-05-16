# npm-install [![stable](http://hughsk.github.io/stability-badges/dist/stable.svg)](http://github.com/hughsk/stability-badges) #

[Atom](http://atom.io/) plugin to automatically install and save any selected
npm packages not already included in the closest `package.json` file.

![npm-install](http://i.imgur.com/i5FKsXH.gif)

## Usage ##

1. Select the `require` or `import` statements of the
   packages you want to install.
2. Open the Command Palette, and type `npm install` to
   bring up the available commands.
3. Your packages will be installed. Enjoy!

## Configuration Options

Accessible from `Settings > Packages > npm-install`:

* **Install Cache:** force your installations to always or never use the local cache.
* **Custom npm PATH lookup:** useful if you keep your npm
  in an unconventional location. Point this to the directory
  of your npm executable should you have
  [any issues](https://github.com/hughsk/atom-npm-install/issues/2).

## Changelog

### 3.0.0

* Packages must now be selected to be installed. This gives
  you control over which packages are being installed instead
  of trying to work that out for you, making it simpler to
  support [scoped packages](https://docs.npmjs.com/misc/scope) :sparkles:.
* The installation pane is now attached to the right
  instead of the bottom of the screen.
* ES6 support! No more parsing errors, also `import`
  statements can be installed like you would requires too.
* CoffeeScript is no longer supported. If you'd like that back, I'd recommend
sticking with the previous version or submitting a pull request to
[atom-selected-requires](https://github.com/hughsk/atom-selected-requires).

### 2.0.0

As of version `2.0.0` keybindings are not included by default. If you miss
these shortcuts, simply add the following to your keymap file:

``` coffeescript
'.workspace':
  'ctrl-alt-i': 'npm-install:save'
  'ctrl-alt-d': 'npm-install:save-dev'
```

## License ##

MIT. See [LICENSE.md](http://github.com/hughsk/npm-install/blob/master/LICENSE.md) for details.
