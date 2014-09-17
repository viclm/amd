rRequire = /\brequire\s*?\(\s*?(['"])([^)]+)\1\s*?\)/g
rRelativeId = /^\.{1,2}/
rStackUrl = /([^@\s(]+)(?::\d+){1,2}\)?$/
rJS = /\.js$/
defaultDependencies = ['require', 'exports', 'module']
mainModuleCount = 0
modules = {}

origin = window.location.origin
unless origin
  origin = window.location.protocol + '//' + window.location.hostname
  origin += window.location.port if window.location.port
workdir = origin
unless window.location.pathname is '/'
  workdir += window.location.pathname.split('/').slice(1, -1).join('/')

config =
  baseUrl: workdir
  paths: {}

unless Array::indexOf
  Array::indexOf = (searchElement, fromIndex) ->
    if @ is undefined or @ is null
      throw new TypeError '"this" is null or not defined'

    length = @length >>> 0; # Hack to convert object.length to a UInt32

    fromIndex = +fromIndex || 0

    if Math.abs(fromIndex) is Infinity
      fromIndex = 0

    if fromIndex < 0
      fromIndex += length
      if fromIndex < 0
        fromIndex = 0

    for index in [fromIndex...length]
      if this[index] is searchElement
        return index

    return -1


loader =

  loading: {}

  loadFile: (moduleId, url, callback) ->
    head = document.getElementsByTagName('head')[0]

    ele = document.createElement 'script'
    ele.type = 'text/javascript'
    ele.async = true
    ele.src = url
    ele.setAttribute 'data-module', moduleId

    doCallback = ->
      callback()
      head.removeChild ele
      ele = null

    if ele.addEventListener
      ele.addEventListener 'load', doCallback, false
      ele.addEventListener 'error', doCallback, false
    else if window.ActiveXObject
      ele.onreadystatechange = ->
        if @readyState is 'loaded' or @readyState is 'complete'
           ele.onreadystatechange = null
           doCallback()
    else
      ele.onload = ele.onerror = doCallback

    head.insertBefore ele, null

  loadModule: (id, stack, callback) ->
    if @loading[id]
      @loading[id].push callback
    else
      @loading[id] = [callback]

      module = modules[id]

      if module
        @loadModuleDependencies id, stack
      else
        @loadFile id, require.toUrl(id), =>
          if modules[id]
            @loadModuleDependencies id, stack
          else
            throw "module #{id} doesn't exist. stack: #{stack}"

  loadModuleDependencies: (id, stack) ->
    module = modules[id]
    if module.exports or module.dependenciesReady
      callbacks = @loading[id]
      @loading[id] = null
      callback?() for callback in callbacks
    else
      deps = module.getPreloadDependencies()
      needLoad = deps.length + 1
      next = () =>
        needLoad--
        if needLoad is 0
          module.dependenciesReady = true
          callbacks = @loading[id]
          @loading[id] = null
          callback?() for callback in callbacks

      for dep in deps
        throw "Circular dependency: #{stack.join ' -> '} -> #{dep}" if stack.indexOf(dep) > -1
        s = stack.slice 0
        s.push dep
        @loadModule dep, s, next

      next()




class Module

  constructor: (id, dependencies, factory) ->

    if typeof id isnt 'string'
      factory = dependencies
      dependencies = id
      id = @resolveAnonymousId()

    if Object::toString.call(dependencies) isnt '[object Array]'
      factory = dependencies
      dependencies = defaultDependencies

    if typeof factory is 'function'
      if dependencies.indexOf('require') > -1
        implicitDependencies = []
        fnstr = factory.toString()
        fnstr.replace rRequire, (s, p1, p2) ->
          implicitDependencies.push p2
        fnstr = null
    else if Object::toString.call(factory) is '[object Object]'
      exports = factory
    else
      throw 'factory is required.'

    @id = id
    @dependencies = dependencies
    @factory = factory

    if implicitDependencies
      @implicitDependencies = implicitDependencies
    else
      @implicitDependencies = []

    if exports
      @exports = exports
      @dependenciesReady = true
      modules[id] =
        uri: require.toUrl @id
        dependencies: @dependencies
        exports: @exports
    else
      modules[id] = @

  destructor: ->
    @id = null
    @dependencies = null
    @factory = null
    @implicitDependencies = null
    @exports = null

  resolveAnonymousId: ->
    ele = @getCurrentScript()
    if ele
      return ele.getAttribute 'data-module'
    #url = url.slice config.baseUrl.length + 1
    #url = url.replace rJS, ''

  getCurrentScript: ->
    if document.currentScript
      return document.currentScript
    else
      eles = document.getElementsByTagName('head')[0].getElementsByTagName('script')
      if 'readyState' in eles[0]
        for ele in eles
          return ele.src if ele.readyState is 'interactive'
      try
        throw new Error
      catch e
        stack = e.stack
      ###
      chrome37:
      Error at http://xliuming.com/error-stack-test.js:2:11
      safari7:
      global http://xliuming.com/error-stack-test.js:2:20
      firefox31
      @http://xliuming.com/error-stack-test.js:2:5
      ie11
      Error at Global code (http://xliuming.com/error-stack-test.js:2:5)
      ie7
      ie6
      undefined
      ###
      if stack
        url = stack.match(rStackUrl)[1]#.replace(/\?.+$/, '')
        for ele in eles
          return ele if ele.src is url

    return null

  getPreloadDependencies: ->
    deps = []
    for dep in @dependencies.concat(@implicitDependencies)
      if defaultDependencies.indexOf(dep) is -1
        deps.push @resolveDependenceId dep
    deps

  resolveDependenceId: (id) ->
    parentId = @id
    if dots = rRelativeId.exec id
      parentId = parentId.split '/'
      parentId = parentId.slice 0, -dots[0].length
      id = parentId.join('/') + id.slice(dots[0].length)

    return id if parentId.indexOf('__anonymous_') is 0

    for own key, value of config.map
      if key is '*'
        wildMap = value
      else if parentId is key or parentId.indexOf(key + '/') is 0
        unless map and map.key.length > key.length
          map = {key: key, value: value}

    map = map ? wildMap

    return id unless map

    for own key, value of map.value
      if id is key or id.indexOf(key + '/') is 0
        unless m and m.key.length > key.length
          m = {key: key, value: value}

    return id unless m

    if rJS.test m.value
      id = m.value
    else
      id = m.value + id.slice(m.key.length)

  execute: () ->
    module =
      uri: require.toUrl @id
      dependencies: @dependencies
      exports: {}
    modules[@id] = module
    localRequire = @createRequire()
    moduleExports = []

    for dep in @dependencies#.slice(0, @factory.length)
      if dep is 'require'
        moduleExports.push localRequire
      else if dep is 'exports'
        moduleExports.push module.exports
      else if dep is 'module'
        moduleExports.push module
      else
        moduleExports.push localRequire(dep)

    module.exports = (@factory?.apply module.exports, moduleExports) || module.exports



  createRequire: () ->
    parent = @

    localRequire = (id, callback) ->
      if typeof id is 'string'
        id = parent.resolveDependenceId id, parent.id
      else
        id = (parent.resolveDependenceId i, parent.id for i in id)
        callback = callback.bind(parent)
      require id, callback

    localRequire.async = (ids, callback) ->
      console?.warn? 'require.async() is deprecated, use require([deps], fn), found at %s.', parent.id
      ids = [ids] if typeof ids is 'string'
      ids = (parent.resolveDependenceId id, parent.id for id in ids)
      define ids, callback.bind(parent.exports)

    localRequire.toUrl = (id) ->
      require.toUrl parent.resolveDependenceId(id, parent.id)

    localRequire


define = (id, dependencies, factory) ->
  new Module(id, dependencies, factory)

define.amd = {}

require = (id, callback) ->
  if typeof id is 'string'
    if modules[id]
      modules[id].exports || modules[id].execute()
    else
      throw "module #{id} is not found."
  else
    mainModuleCount++
    anonymousId = '__anonymous_' + mainModuleCount + '__'
    define anonymousId, id, callback
    loader.loadModule anonymousId, [], ->
      modules[anonymousId].execute()
      delete modules[anonymousId]

require.toUrl = (id) ->
  paths = []
  for own key, value of config.paths
    if id is key or id.indexOf(key + '/') is 0
      paths.push {key: key, value: value}

  if paths.length
    paths = paths.sort (p1, p2)-> p2.key.length - p1.key.length
    if rJS.test paths[0].value
      id = paths[0].value
    else
      id = paths[0].value + id.slice(paths[0].key.length)

  if rJS.test id
    id
  else if id.indexOf('/') is 0 or id.indexOf('://') > -1
    id + '.js'
  else if config.baseUrl
    config.baseUrl + '/' + id + '.js'
  else
    id + '.js'

require.config = (options) ->
  for own key, value of options
    switch key
      when 'baseUrl'
        if dots = rRelativeId.exec value
          if dots[0].length is 2 and workdir isnt origin
            value = workdir.split('/').slice(0, -1).join('/') + value.slice(dots[0].length)
          else
            value = origin + value.slice(dots[0].length)
        #else if value.indexOf('://') === -1
        #  value = origin + value
        config.baseUrl = value
      when 'paths'
        config.paths = config.paths ? {}
        for own k, v of value
          config.paths[k] = v
      when 'map'
        config.map = config.map ? {}
        for own k, v of value
          config.map[k] = v
      when 'shim'
        for own k, v of value
          v = {deps: v} if Object::toString.call(v) is '[object Array]'
          do (k, v) ->
            define k, v.deps ? [], ->
              res = v.init?()
              res = eval(v.exports) if typeof res is 'undefined'
              res


window.define = define
window.require = require
