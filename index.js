var npmProc = null
var messages
var panel
var outer
var inner

exports.activate = activate
exports.config   = {
  cacheBehaviour: {
    'type': 'string',
    'default': 'default',
    'title': 'Install Cache',
    'description': 'Completely enable or disable package caching. By default, this follows your npm configuration behaviour',
    'enum': [
      'default',
      'always cache',
      'never cache'
    ]
  },
  npmPath: {
    'type': 'string',
    'default': '',
    'title': 'Custom npm PATH lookup',
    'description': 'Useful if you keep your npm in an unconventional location'
  }
}

function activate() {
  const Messages = require('atom-message-panel').MessagePanelView

  messages = messages || new Messages({
    title: 'npm install'
  })

  atom.commands.add('atom-workspace', 'npm-install:save', Save({ dev: false }))
  atom.commands.add('atom-workspace', 'npm-install:save-dev', Save({ dev: true }))
}

function Save(opts) {
  const core     = flattenCoreModuleList(require('resolve/lib/core.json'))
  const Selected = require('atom-selected-requires')
  const relative = require('relative-require-regex')
  const spawn    = require('child_process').spawn
  const ansihtml = require('ansi-html-stream')
  const Combine  = require('combine-stream')
  const ansiHTML = require('ansi-to-html')
  const findup   = require('findup')
  const domify   = require('domify')
  const which    = require('which')
  const split    = require('split')
  const xtend    = require('xtend')
  const path     = require('path')
  const fs       = require('fs')
  const dev      = !!opts.dev

  inner = inner || document.createElement('div')
  outer = outer || document.createElement('div')
  outer.setAttribute('class', 'npm-install')
  inner.setAttribute('class', 'terminal')
  outer.appendChild(inner)
  panel = panel || atom.workspace.addRightPanel({
    item: outer,
    visible: false
  })

  return function() {
    messages.clear()

    const editor   = atom.workspace.getActiveTextEditor()
    const filename = editor.getPath()
    const dirname  = path.dirname(filename)
    const depKey   = dev ? 'devDependencies' : 'dependencies'
    const depFlag  = dev ? '--save-dev' : '--save'

    try {
      var selected = Selected(editor)
    } catch(e) {
      return error(e)
    }

    findup(dirname, 'package.json', function(err, cwd) {
      if (err) return error(err)

      try {
        var pkgFile = path.join(cwd, 'package.json')
        var pkgData = fs.readFileSync(pkgFile, 'utf8')
        var pkgJSON = JSON.parse(pkgData)
        var pkgDeps = pkgJSON[depKey] || {}
      } catch(e) {
        return error(e)
      }

      var targets = selected.filter(function(name) {
        return !relative().test(name)
      }).filter(function(name) {
        return core.indexOf(name) === -1
      }).map(function(dir) {
        return dir.match(/^((?:@[^/]*\/)?(?:[^/]*)).*?$/)[1]
      }).filter(function(name) {
        return !(name in pkgDeps)
      })

      if (!targets.length) return error(new Error('Nothing to install!'))

      var cache = atom.config.get('npm-install.cacheBehaviour')
      var exe   = process.platform === 'win32' ? 'npm.cmd' : 'npm'
      var args  = [exe, 'install', depFlag, '--color=always']
        .concat(targets)

      if (cache === 'always cache') args.push('--cache-min=Infinity')
      if (cache === 'never cache')  args.push('--cache-min=0')

      queue(dirname, args)
    })
  }

  function queue(dirname, args) {
    if (npmProc) return error(new Error(
      'Only one installation can be run at a time. ' +
      'Try selecting multiple packages before commencing an install next time.'
    ))

    var convert = new ansiHTML({
      newline: false,
      escapeXML: false,
      stream: true
    })

    var addPath = (atom.config.get('npm-install:npmPath') || '').trim()
    var newPath = process.env.PATH + ':/usr/bin/node:/usr/local/bin'
    if (addPath) newPath = addPath + ':' + newPath

    which(args[0], {
      path: newPath
    }, function(err, npm) {
      if (err) return error(err)

      inner.innerHTML = ''
      npmProc = spawn(npm, args.slice(1), {
        cwd: dirname,
        env: xtend(process.env, {
          PATH: newPath
        })
      })

      var output = new Combine([
        npmProc.stdout,
        npmProc.stderr
      ])

      output.pipe(split()).on('data', function(line) {
        inner.appendChild(domify(convert.toHtml(line) + '<br/>'))
      })

      panel.show()
      npmProc.on('exit', function(code) {
        if (code !== 0) error(new Error('Unexpected exit code from npm: ' + code))

        setTimeout(function() {
          npmProc = null
          panel.hide()
          inner.innerHTML = ''
        }, 1000)
      })
    })
  }
}

function error(err) {
  const Message = require('atom-message-panel').PlainMessageView
  const Lined   = require('atom-message-panel').LineMessageView

  messages.attach()

  if (!err.loc) {
    messages.add(new Message({
      message: err.message
    }))
  } else {
    messages.add(new Lined({
      message: err.message,
      line: err.loc.line
    }))
  }
}

function flattenCoreModuleList(modules) {
  return Object.keys(modules).reduce(function (out, key) {
    return out.concat(modules[key])
  }, [])
}
