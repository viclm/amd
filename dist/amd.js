(function() {
  var Loader, Module, config, defaultDependencies, define, loader, mainModuleCount, modules, rJS, rRelativeId, rRequire, require,
    __hasProp = {}.hasOwnProperty;

  config = {
    baseUrl: '',
    paths: {}
  };

  rRequire = /\brequire\s*?\(\s*?(['"])([^)]+)\1\s*?\)/g;

  rRelativeId = /^\.{1,2}/;

  rJS = /\.js$/;

  defaultDependencies = ['require', 'exports', 'module'];

  modules = {};

  mainModuleCount = 0;

  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {
      var index, length, _i;
      if (this === void 0 || this === null) {
        throw new TypeError('"this" is null or not defined');
      }
      length = this.length >>> 0;
      fromIndex = +fromIndex || 0;
      if (Math.abs(fromIndex) === Infinity) {
        fromIndex = 0;
      }
      if (fromIndex < 0) {
        fromIndex += length;
        if (fromIndex < 0) {
          fromIndex = 0;
        }
      }
      for (index = _i = fromIndex; fromIndex <= length ? _i < length : _i > length; index = fromIndex <= length ? ++_i : --_i) {
        if (this[index] === searchElement) {
          return fromIndex;
        }
      }
      return -1;
    };
  }

  Loader = (function() {
    function Loader() {
      this.loading = {};
    }

    Loader.prototype.loadFile = function(url, callback) {
      var doCallback, ele, head;
      head = document.getElementsByTagName('head')[0];
      ele = document.createElement('script');
      ele.type = 'text/javascript';
      ele.async = true;
      ele.src = url;
      doCallback = function() {
        callback();
        head.removeChild(ele);
        return ele = null;
      };
      if (ele.addEventListener) {
        ele.addEventListener('load', doCallback, false);
        ele.addEventListener('error', doCallback, false);
      } else if (window.ActiveXObject) {
        ele.onreadystatechange = function() {
          if (this.readyState === 'loaded' || this.readyState === 'complete') {
            ele.onreadystatechange = null;
            return doCallback();
          }
        };
      } else {
        ele.onload = ele.onerror = doCallback;
      }
      return head.insertBefore(ele, null);
    };

    Loader.prototype.loadModule = function(id, stack, callback) {
      var module;
      if (this.loading[id]) {
        return this.loading[id].push(callback);
      } else {
        this.loading[id] = [callback];
        module = modules[id];
        if (module) {
          return this.loadModuleDependencies(id, stack);
        } else {
          return this.loadFile(require.toUrl(id), (function(_this) {
            return function() {
              if (modules[id]) {
                return _this.loadModuleDependencies(id, stack);
              } else {
                throw "module " + id + " doesn't exist. stack: " + stack;
              }
            };
          })(this));
        }
      }
    };

    Loader.prototype.loadModuleDependencies = function(id, stack) {
      var callback, callbacks, dep, deps, module, needLoad, next, s, _i, _j, _len, _len1, _results;
      module = modules[id];
      if (module.exports || module.dependenciesReady) {
        callbacks = this.loading[id];
        this.loading[id] = null;
        _results = [];
        for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
          callback = callbacks[_i];
          _results.push(typeof callback === "function" ? callback() : void 0);
        }
        return _results;
      } else {
        deps = module.getPreloadDependencies();
        needLoad = deps.length + 1;
        next = (function(_this) {
          return function() {
            var _j, _len1, _results1;
            needLoad--;
            if (needLoad === 0) {
              module.dependenciesReady = true;
              callbacks = _this.loading[id];
              _this.loading[id] = null;
              _results1 = [];
              for (_j = 0, _len1 = callbacks.length; _j < _len1; _j++) {
                callback = callbacks[_j];
                _results1.push(typeof callback === "function" ? callback() : void 0);
              }
              return _results1;
            }
          };
        })(this);
        for (_j = 0, _len1 = deps.length; _j < _len1; _j++) {
          dep = deps[_j];
          if (stack.indexOf(dep) > -1) {
            throw "Circular dependency: " + (stack.join(' -> ')) + " -> " + dep;
          }
          s = stack.slice(0);
          s.push(dep);
          this.loadModule(dep, s, next);
        }
        return next();
      }
    };

    return Loader;

  })();

  Module = (function() {
    function Module(id, dependencies, factory) {
      var exports, fnstr, implicitDependencies;
      if (Object.prototype.toString.call(dependencies) !== '[object Array]') {
        factory = dependencies;
        dependencies = defaultDependencies;
      }
      if (typeof factory === 'function') {
        if (dependencies.indexOf('require') > -1) {
          implicitDependencies = [];
          fnstr = factory.toString();
          fnstr.replace(rRequire, function(s, p1, p2) {
            return implicitDependencies.push(p2);
          });
          fnstr = null;
        }
      } else if (Object.prototype.toString.call(factory) === '[object Object]') {
        exports = factory;
      } else {
        throw 'factory is required.';
      }
      this.id = id;
      this.dependencies = dependencies;
      this.factory = factory;
      if (implicitDependencies) {
        this.implicitDependencies = implicitDependencies;
      } else {
        this.implicitDependencies = [];
      }
      if (exports) {
        this.exports = exports;
        this.dependenciesReady = true;
        modules[id] = {
          uri: require.toUrl(this.id),
          dependencies: this.dependencies,
          exports: this.exports
        };
      } else {
        modules[id] = this;
      }
    }

    Module.prototype.destructor = function() {
      this.id = null;
      this.dependencies = null;
      this.factory = null;
      this.implicitDependencies = null;
      return this.exports = null;
    };

    Module.prototype.resolveAnonymousId = function() {
      var e, stack, url;
      if (document.currentScript) {
        return url = document.currentScript.src;
      } else {
        try {
          throw new Error;
        } catch (_error) {
          e = _error;
          stack = e.stack;
        }

        /*
        chrome37:
        Error at http://xliuming.com/error-stack-test.js:2:11
        safari7:
        global http://xliuming.com/error-stack-test.js:2:20
        firefox31
        @http://xliuming.com/error-stack-test.js:2:5
        ie11
        Error at Global code (http://fed.d.xiaonei.com/javascripts/error-stack-test.js:2:5)
        ie7
        ie6
        undefined
         */
        stack = stack.split(/[@ ]/g).pop();
        if (stack.charAt(0) === '(') {
          stack = stack.slice(1, -1);
        }
        return stack = stack.replace(/(:\d+)?:\d+$/i, "");
      }
    };

    Module.prototype.getPreloadDependencies = function() {
      var dep, deps, _i, _len, _ref;
      deps = [];
      _ref = this.dependencies.concat(this.implicitDependencies);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        dep = _ref[_i];
        if (defaultDependencies.indexOf(dep) === -1) {
          deps.push(this.resolveDependenceId(dep));
        }
      }
      return deps;
    };

    Module.prototype.resolveDependenceId = function(id) {
      var dot, key, m, map, parentId, value, wildMap, _ref, _ref1;
      parentId = this.id;
      if (dot = rRelativeId.exec(id)) {
        parentId = parentId.split('/');
        parentId = parentId.slice(0, -dot[0].length);
        id = parentId.join('/') + id.slice(dot[0].length);
      }
      if (parentId.indexOf('__anonymous_') === 0) {
        return id;
      }
      _ref = config.map;
      for (key in _ref) {
        if (!__hasProp.call(_ref, key)) continue;
        value = _ref[key];
        if (key === '*') {
          wildMap = value;
        } else if (parentId === key || parentId.indexOf(key + '/') === 0) {
          if (!(map && map.key.length > key.length)) {
            map = {
              key: key,
              value: value
            };
          }
        }
      }
      map = map != null ? map : wildMap;
      if (!map) {
        return id;
      }
      _ref1 = map.value;
      for (key in _ref1) {
        if (!__hasProp.call(_ref1, key)) continue;
        value = _ref1[key];
        if (id === key || id.indexOf(key + '/') === 0) {
          if (!(m && m.key.length > key.length)) {
            m = {
              key: key,
              value: value
            };
          }
        }
      }
      if (!m) {
        return id;
      }
      if (rJS.test(m.value)) {
        return id = m.value;
      } else {
        return id = m.value + id.slice(m.key.length);
      }
    };

    Module.prototype.execute = function() {
      var dep, localRequire, module, moduleExports, _i, _len, _ref;
      module = {
        uri: require.toUrl(this.id),
        dependencies: this.dependencies,
        exports: {}
      };
      modules[this.id] = module;
      localRequire = this.createRequire();
      moduleExports = [];
      _ref = this.dependencies;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        dep = _ref[_i];
        if (dep === 'require') {
          moduleExports.push(localRequire);
        } else if (dep === 'exports') {
          moduleExports.push(module.exports);
        } else if (dep === 'module') {
          moduleExports.push(module);
        } else {
          moduleExports.push(localRequire(dep));
        }
      }
      return module.exports = (this.factory.apply(module.exports, moduleExports)) || module.exports;
    };

    Module.prototype.createRequire = function() {
      var localRequire, parent;
      parent = this;
      localRequire = function(id, callback) {
        var i;
        if (typeof id === 'string') {
          id = parent.resolveDependenceId(id, parent.id);
        } else {
          id = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = id.length; _i < _len; _i++) {
              i = id[_i];
              _results.push(parent.resolveDependenceId(i, parent.id));
            }
            return _results;
          })();
          callback = callback.bind(parent);
        }
        return require(id, callback);
      };
      localRequire.async = function(ids, callback) {
        var id;
        if (typeof console !== "undefined" && console !== null) {
          if (typeof console.warn === "function") {
            console.warn('require.async() is deprecated, use require([deps], fn), found at %s.', parent.id);
          }
        }
        if (typeof ids === 'string') {
          ids = [ids];
        }
        ids = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = ids.length; _i < _len; _i++) {
            id = ids[_i];
            _results.push(parent.resolveDependenceId(id, parent.id));
          }
          return _results;
        })();
        return define(ids, callback.bind(parent.exports));
      };
      localRequire.toUrl = function(id) {
        return require.toUrl(parent.resolveDependenceId(id, parent.id));
      };
      return localRequire;
    };

    return Module;

  })();

  loader = new Loader;

  define = function(id, dependencies, factory) {
    if (typeof id !== 'string') {
      return require(id, dependencies);
    } else {
      return new Module(id, dependencies, factory);
    }
  };

  define.amd = {};

  require = function(id, callback) {
    var anonymousId;
    if (typeof id === 'string') {
      if (modules[id]) {
        return modules[id].exports || modules[id].execute();
      } else {
        throw "module " + id + " is not found.";
      }
    } else {
      mainModuleCount++;
      anonymousId = '__anonymous_' + mainModuleCount + '__';
      define(anonymousId, id, callback);
      return loader.loadModule(anonymousId, [], function() {
        modules[anonymousId].execute();
        return delete modules[anonymousId];
      });
    }
  };

  require.toUrl = function(id) {
    var key, paths, value, _ref;
    paths = [];
    _ref = config.paths;
    for (key in _ref) {
      if (!__hasProp.call(_ref, key)) continue;
      value = _ref[key];
      if (id === key || id.indexOf(key + '/') === 0) {
        paths.push({
          key: key,
          value: value
        });
      }
    }
    if (paths.length) {
      paths = paths.sort(function(p1, p2) {
        return p2.key.length - p1.key.length;
      });
      if (rJS.test(paths[0].value)) {
        id = paths[0].value;
      } else {
        id = paths[0].value + id.slice(paths[0].key.length);
      }
    }
    if (rJS.test(id)) {
      return id;
    } else if (id.indexOf('/') === 0 || id.indexOf('://') > -1) {
      return id + '.js';
    } else if (config.baseUrl) {
      return config.baseUrl + '/' + id + '.js';
    } else {
      return id + '.js';
    }
  };

  require.config = function(options) {
    var k, key, v, value, _ref, _ref1, _results;
    _results = [];
    for (key in options) {
      if (!__hasProp.call(options, key)) continue;
      value = options[key];
      switch (key) {
        case 'baseUrl':
          _results.push(config.baseUrl = value);
          break;
        case 'paths':
          config.paths = (_ref = config.paths) != null ? _ref : {};
          _results.push((function() {
            var _results1;
            _results1 = [];
            for (k in value) {
              if (!__hasProp.call(value, k)) continue;
              v = value[k];
              _results1.push(config.paths[k] = v);
            }
            return _results1;
          })());
          break;
        case 'map':
          config.map = (_ref1 = config.paths) != null ? _ref1 : {};
          _results.push((function() {
            var _results1;
            _results1 = [];
            for (k in value) {
              if (!__hasProp.call(value, k)) continue;
              v = value[k];
              _results1.push(config.map[k] = v);
            }
            return _results1;
          })());
          break;
        case 'shim':
          _results.push((function() {
            var _results1;
            _results1 = [];
            for (k in value) {
              if (!__hasProp.call(value, k)) continue;
              v = value[k];
              if (Object.prototype.toString.call(v) === '[object Array]') {
                v = {
                  deps: v
                };
              }
              _results1.push((function(k, v) {
                var _ref2;
                return define(k, (_ref2 = v.deps) != null ? _ref2 : [], function() {
                  var res;
                  res = typeof v.init === "function" ? v.init() : void 0;
                  if (typeof res === 'undefined') {
                    res = eval(v.exports);
                  }
                  return res;
                });
              })(k, v));
            }
            return _results1;
          })());
          break;
        default:
          _results.push(void 0);
      }
    }
    return _results;
  };

  window.define = define;

  window.require = require;

}).call(this);
