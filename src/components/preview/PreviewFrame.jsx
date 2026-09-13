import { useState, useRef } from 'react'
import { RefreshCw, ExternalLink, AlertTriangle, Terminal, Wifi } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function collectStyles(files) {
  return files
    .filter((f) => f.path.endsWith('.css') && !f.path.includes('node_modules'))
    .map((f) => {
      const content = (f.content || '').replace(/@tailwind\s+\w+;?/g, '')
      return `<style>/* ${f.path} */\n${content}\n</style>`
    })
    .join('\n')
}

function sortByDependencyOrder(files) {
  const order = (f) => {
    const p = f.path.toLowerCase()
    if (p.includes('util') || p.includes('helper') || p.includes('lib') || p.includes('hook')) return 0
    if (p.includes('service') || p.includes('store') || p.includes('context')) return 1
    if (p.includes('component')) return 2
    if (p.includes('page') || p.includes('view') || p.includes('screen')) return 3
    if (p === 'src/app.jsx' || p === 'src/app.js' || p === 'src/app.tsx') return 5
    if (p.includes('main') || p.includes('index')) return 6
    return 4
  }
  return [...files].sort((a, b) => order(a) - order(b))
}

// ─── Strategy A: Plain HTML ───────────────────────────────────────────────────

function buildHtmlPreview(files) {
  const indexHtml = files.find(
    (f) => f.path === 'index.html' || f.path === 'public/index.html'
  )
  if (indexHtml) return indexHtml.content || ''

  const cssFiles = files.filter((f) => f.path.endsWith('.css'))
  const jsFiles = files.filter(
    (f) => (f.path.endsWith('.js') || f.path.endsWith('.mjs')) && !f.path.includes('config')
  )

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  ${cssFiles.map((f) => `<style>${f.content || ''}</style>`).join('\n')}
</head>
<body>
  <div id="app"></div>
  ${jsFiles.map((f) => `<script>${f.content || ''}<\/script>`).join('\n')}
</body>
</html>`
}

// ─── Strategy B: React / Next.js ─────────────────────────────────────────────

/** Pre-process a file's content before handing it to Babel */
function preprocessContent(content) {
  return (
    content
      // Replace Vite's import.meta.env with a window stub
      .replace(/import\.meta\.env/g, '(window.__VITE_ENV||{})')
      // Replace import.meta.hot (Vite HMR) with undefined
      .replace(/import\.meta\.hot/g, 'undefined')
      // Replace import.meta.url with the filename string
      .replace(/import\.meta\.url/g, '"preview://file"')
  )
}

function buildReactPreview(files, project) {
  // Only include files inside src/ — backend/, server.js, config files etc. are skipped
  const srcFiles = files.filter(
    (f) =>
      f.path.startsWith('src/') &&
      (f.path.endsWith('.jsx') || f.path.endsWith('.js') ||
       f.path.endsWith('.tsx') || f.path.endsWith('.ts')) &&
      !f.path.includes('node_modules') &&
      !f.path.includes('vite.config') &&
      !f.path.includes('tailwind.config') &&
      !f.path.includes('postcss.config') &&
      !f.path.includes('eslint') &&
      !f.path.endsWith('.test.js') && !f.path.endsWith('.test.jsx') &&
      !f.path.endsWith('.spec.js') && !f.path.endsWith('.spec.jsx')
  )

  const sorted = sortByDependencyOrder(srcFiles)
  const styles = collectStyles(files)

  const appFile =
    files.find((f) => f.path === 'src/App.jsx') ||
    files.find((f) => f.path === 'src/App.js') ||
    files.find((f) => f.path === 'src/App.tsx') ||
    files.find((f) => f.path.toLowerCase().endsWith('/app.jsx')) ||
    files.find((f) => f.path.toLowerCase().endsWith('/app.js'))

  const appFilePath = appFile ? appFile.path : null

  // Embed files as JSON — content is pre-processed then Babel handles import→require
  const filesJson = JSON.stringify(
    sorted.map((f) => ({ path: f.path, content: preprocessContent(f.content || '') }))
  )
  const appPathJson = JSON.stringify(appFilePath)
  const projectName = (project?.name || 'Preview').replace(/</g, '&lt;')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName}</title>

  <!-- Tailwind -->
  <script src="https://cdn.tailwindcss.com"><\/script>

  <!-- React 18 -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>

  <!-- Babel Standalone -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>

  <!-- ── Stubs (all defined before any user code runs) ── -->
  <script>
    // Vite env stub
    window.__VITE_ENV = {};

    // React Router DOM v6 stub — full routing in an iframe isn't meaningful,
    // so we render components directly without real navigation.
    window.ReactRouterDOM = (function() {
      var React = window.React;
      function BrowserRouter(props) { return props.children || null; }
      function MemoryRouter(props) { return props.children || null; }
      function HashRouter(props) { return props.children || null; }
      function Routes(props) {
        var children = React.Children.toArray(props.children);
        // Find route matching '/' or just render the first one
        var match = children.find(function(c) {
          return c && c.props && (c.props.path === '/' || c.props.index);
        }) || children[0];
        return match ? (match.props.element || null) : null;
      }
      function Route(props) { return props.element || props.children || null; }
      function Link(props) {
        return React.createElement('a', {
          href: '#', className: props.className, style: props.style,
          onClick: function(e) { e.preventDefault(); }
        }, props.children);
      }
      function NavLink(props) { return Link(props); }
      function Navigate() { return null; }
      function Outlet() { return null; }
      function useNavigate() { return function() {}; }
      function useParams() { return {}; }
      function useLocation() { return { pathname: '/', search: '', hash: '', state: null }; }
      function useSearchParams() { return [{ get: function() { return null; } }, function() {}]; }
      function useMatch() { return null; }
      function useRoutes() { return null; }
      return {
        BrowserRouter: BrowserRouter, MemoryRouter: MemoryRouter,
        HashRouter: HashRouter, Routes: Routes, Route: Route,
        Link: Link, NavLink: NavLink, Navigate: Navigate, Outlet: Outlet,
        useNavigate: useNavigate, useParams: useParams,
        useLocation: useLocation, useSearchParams: useSearchParams,
        useMatch: useMatch, useRoutes: useRoutes,
      };
    })();

    // Framer Motion stub — renders as plain HTML tags, no animations
    window.FramerMotion = (function() {
      var React = window.React;
      var MOTION_PROPS = ['initial','animate','exit','transition','whileHover',
        'whileTap','whileFocus','layout','variants','custom','drag',
        'dragConstraints','onAnimationComplete','onHoverStart','onHoverEnd'];
      var motion = new Proxy({}, {
        get: function(_, tag) {
          return React.forwardRef(function(props, ref) {
            var clean = {};
            Object.keys(props).forEach(function(k) {
              if (MOTION_PROPS.indexOf(k) === -1) clean[k] = props[k];
            });
            clean.ref = ref;
            return React.createElement(tag, clean);
          });
        }
      });
      function AnimatePresence(props) { return props.children || null; }
      function useAnimation() { return { start: function() {}, stop: function() {} }; }
      function useMotionValue(v) { return { get: function() { return v; }, set: function() {} }; }
      function useSpring(v) { return { get: function() { return v; }, set: function() {} }; }
      return { motion: motion, AnimatePresence: AnimatePresence,
        useAnimation: useAnimation, useMotionValue: useMotionValue, useSpring: useSpring };
    })();

    // Zustand stub
    window.zustand = (function() {
      var React = window.React;
      function create(fn) {
        var state = {};
        var listeners = [];
        var setState = function(updater) {
          var patch = typeof updater === 'function' ? updater(state) : updater;
          state = Object.assign({}, state, patch);
          listeners.slice().forEach(function(l) { l(state); });
        };
        state = fn(setState, function() { return state; });
        function useStore(sel) {
          var get = function() { return sel ? sel(state) : state; };
          var snap = React.useRef(get());
          var forceRender = React.useState(0)[1];
          React.useEffect(function() {
            function listener(s) {
              var next = sel ? sel(s) : s;
              if (next !== snap.current) { snap.current = next; forceRender(function(n) { return n + 1; }); }
            }
            listeners.push(listener);
            return function() { listeners = listeners.filter(function(l) { return l !== listener; }); };
          }, []);
          return snap.current;
        }
        Object.assign(useStore, state, { getState: function() { return state; }, setState: setState });
        return useStore;
      }
      return { create: create, default: { create: create } };
    })();

    // Lucide-React stub — simple SVG icons
    window.LucideReact = new Proxy({}, {
      get: function(_, name) {
        return function Icon(props) {
          var size = (props && props.size) || 16;
          var color = (props && props.color) || 'currentColor';
          var cls = (props && props.className) || '';
          var sw = (props && props.strokeWidth) || 2;
          return React.createElement('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: size, height: size, viewBox: '0 0 24 24',
            fill: 'none', stroke: color, strokeWidth: sw,
            strokeLinecap: 'round', strokeLinejoin: 'round',
            className: cls,
          },
            React.createElement('rect', { width: 18, height: 18, x: 3, y: 3, rx: 2 }),
            React.createElement('path', { d: 'M9 12h6M12 9v6' })
          );
        };
      }
    });

    // react-hot-toast stub
    var _toast = function(m) { console.log('[toast]', m); return 't'; };
    Object.assign(_toast, {
      success: function(m) { console.log('[toast ✓]', m); },
      error: function(m) { console.error('[toast ✗]', m); },
      promise: function(p) { return p; },
      loading: function(m) { console.log('[toast…]', m); return 't'; },
      dismiss: function() {},
      custom: function() {},
    });
    window.ReactHotToast = {
      toast: _toast,
      Toaster: function() { return null; },
      useToaster: function() { return { toasts: [], handlers: {} }; },
    };

    // axios stub
    window.axios = (function() {
      var stub = function() { return Promise.resolve({ data: {}, status: 200 }); };
      return Object.assign(stub, {
        get: stub, post: stub, put: stub, patch: stub, delete: stub,
        create: function() { return stub; },
        defaults: { headers: { common: {} } },
      });
    })();

    // clsx / classnames
    window.__clsx = function() {
      return [].slice.call(arguments).flat().filter(Boolean).join(' ');
    };

    // process stub — many libs check process.env.NODE_ENV
    window.process = window.process || {
      env: { NODE_ENV: 'development' },
      browser: true,
      version: '',
      nextTick: function(fn) { setTimeout(fn, 0); },
    };

    // Buffer stub
    window.Buffer = window.Buffer || { isBuffer: function() { return false; } };

    // Wrap React.createElement to catch undefined/null component types gracefully
    // instead of crashing the whole preview.
    // We do this after React loads so window.React is already set.
    window.addEventListener('load', function() {}, false); // ensure React is ready
    (function patchReact() {
      if (!window.React || !window.React.createElement) return;
      var _orig = window.React.createElement;
      window.React.createElement = function(type, props) {
        if (type === undefined || type === null) {
          // Render a visible warning pill instead of crashing
          var name = (props && (props.displayName || props.name)) || '(unknown)';
          console.error('[preview] React.createElement received undefined type. Check imports in your components. Props:', props);
          return _orig('span', {
            style: {
              display: 'inline-block',
              background: '#fbbf2422',
              border: '1px solid #f59e0b',
              color: '#fbbf24',
              borderRadius: '4px',
              padding: '2px 8px',
              fontFamily: 'monospace',
              fontSize: '11px',
              margin: '2px',
            }
          }, '⚠ undefined component');
        }
        return _orig.apply(this, arguments);
      };
    })();
  <\/script>

  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
    #root { min-height: 100vh; }
  </style>
  ${styles}
</head>
<body>
  <div id="root"></div>

  <script>
  (function() {

    // ── CDN map — resolved lazily at require()-time ───────────────────────────
    var CDN_MAP = {
      'react':                function() { return window.React; },
      'react/jsx-runtime':    function() { return window.React; },
      'react-dom':            function() { return window.ReactDOM; },
      'react-dom/client':     function() { return window.ReactDOM; },
      'react-router-dom':     function() { return window.ReactRouterDOM; },
      'react-router':         function() { return window.ReactRouterDOM; },
      'framer-motion':        function() { return window.FramerMotion; },
      'zustand':              function() { return window.zustand; },
      'lucide-react':         function() { return window.LucideReact; },
      'react-hot-toast':      function() { return window.ReactHotToast; },
      'axios':                function() { return window.axios; },
      'clsx':                 function() { return { default: window.__clsx, clsx: window.__clsx }; },
      'classnames':           function() { return { default: window.__clsx }; },
      'date-fns':             function() { return {}; },
      'uuid':                 function() { return { v4: function() { return Math.random().toString(36).slice(2); } }; },
      'lodash':               function() { return {}; },
      'lodash-es':            function() { return {}; },
    };

    var registry = {};
    var errors   = {};

    // ── Path resolver ──────────────────────────────────────────────────────────
    function resolvePath(from, to) {
      if (to.startsWith('@/')) return to.replace('@/', 'src/');
      if (!to.startsWith('.')) return to;
      var parts = from.split('/');
      parts.pop();
      to.split('/').forEach(function(seg) {
        if (seg === '..') { parts.pop(); }
        else if (seg !== '.') { parts.push(seg); }
      });
      return parts.join('/');
    }

    function lookupModule(id) {
      return (
        registry[id] ||
        registry[id + '.jsx'] ||
        registry[id + '.js'] ||
        registry[id + '.tsx'] ||
        registry[id + '.ts'] ||
        registry[id + '/index.jsx'] ||
        registry[id + '/index.js'] ||
        null
      );
    }

    function makeRequire(currentPath) {
      return function require(id) {
        // 1. Known CDN stubs
        if (CDN_MAP[id]) return CDN_MAP[id]();
        // 2. Scoped packages not in CDN map — return safe stub
        if (!id.startsWith('.') && !id.startsWith('@/')) {
          console.warn('[preview] no stub for npm package:', id, '— returning {}');
          return {};
        }
        // 3. Local file
        var resolved = resolvePath(currentPath, id);
        var mod = lookupModule(resolved);
        if (mod) return mod;
        console.warn('[preview] local module not found:', id, '->', resolved);
        return {};
      };
    }

    // ── Files injected at build time ───────────────────────────────────────────
    var files    = ${filesJson};
    var APP_PATH = ${appPathJson};

    // ── Babel transform + execute ──────────────────────────────────────────────
    function runFile(path, content) {
      var transformed;
      try {
        transformed = Babel.transform(content, {
          filename: path,
          presets: [
            ['react', { runtime: 'classic' }],
            ['env', {
              targets: { chrome: '90' },
              modules: 'commonjs',
            }],
          ],
          sourceType: 'module',
        }).code;
      } catch (e) {
        errors[path] = 'Babel: ' + e.message;
        console.error('[preview] Babel error:', path, e.message);
        registry[path] = {};
        return;
      }

      var mod = { exports: {} };
      try {
        // eslint-disable-next-line no-new-func
        new Function('require', 'module', 'exports', '__dirname', '__filename', transformed)(
          makeRequire(path),
          mod,
          mod.exports,
          path.split('/').slice(0, -1).join('/'),
          path
        );
      } catch (e) {
        errors[path] = 'Runtime: ' + e.message;
        console.error('[preview] runtime error:', path, e.message, e);
        // Don't return — keep mod.exports, default may be partially set
      }

      registry[path] = mod.exports;

      // Detect files where Babel void 0 placeholder was never replaced:
      // exports.default is undefined but no Babel error = runtime throw mid-file.
      var keys = Object.keys(mod.exports);
      var hasDefaultKey = keys.indexOf('default') !== -1 || keys.indexOf('Default') !== -1;
      if (hasDefaultKey && mod.exports['default'] === undefined && !errors[path]) {
        var w = 'default export is undefined — a runtime error likely occurred mid-file.';
        errors[path] = w;
        console.warn('[preview]', path, w);
      }
    }

    for (var i = 0; i < files.length; i++) {
      runFile(files[i].path, files[i].content);
    }

    // ── Error panel ────────────────────────────────────────────────────────────
    function showErrors() {
      var keys = Object.keys(errors);
      if (!keys.length) return;
      var el = document.createElement('div');
      el.style.cssText = [
        'position:fixed;bottom:0;left:0;right:0;z-index:9999',
        'background:#1c0404;border-top:2px solid #dc2626',
        'padding:8px 12px;font-family:monospace;font-size:11px;color:#f87171',
        'max-height:35vh;overflow-y:auto'
      ].join(';');
      el.innerHTML = '<b style="color:#fca5a5">⚠ ' + keys.length + ' file error(s) — check browser console for details:</b>' +
        keys.map(function(k) {
          return '<br><span style="color:#fb923c">' + k + '</span>: ' +
            String(errors[k]).replace(/&/g,'&amp;').replace(/</g,'&lt;');
        }).join('');
      document.body.appendChild(el);
    }

    // ── Mount ──────────────────────────────────────────────────────────────────
    function mount() {
      var rootEl = document.getElementById('root');

      if (!APP_PATH) {
        rootEl.innerHTML = '<p style="color:#fbbf24;padding:1rem;font-family:monospace">⚠ No App.jsx found in generated files.</p>';
        showErrors(); return;
      }

      var appMod = lookupModule(APP_PATH);
      var App = (appMod && (appMod.default || appMod.App || appMod.app)) ||
                (typeof appMod === 'function' ? appMod : null);

      if (!App) {
        var errCount = Object.keys(errors).length;
        rootEl.innerHTML =
          '<pre style="color:#fbbf24;padding:1rem;font-family:monospace;white-space:pre-wrap;font-size:12px">' +
          '⚠ Could not load App from: ' + APP_PATH + '\\n\\n' +
          (errCount
            ? errCount + ' file(s) had errors — see error panel below.\\n'
            : 'File loaded OK but no default export found.\\n' +
              'Module keys: ' + (appMod ? Object.keys(appMod).join(', ') || '(none)' : 'null') + '\\n' +
              'All loaded modules: ' + Object.keys(registry).join(', ')
          ) + '</pre>';
        showErrors(); return;
      }

      try {
        ReactDOM.createRoot(rootEl).render(React.createElement(App));
        showErrors();
      } catch (e) {
        rootEl.innerHTML =
          '<pre style="color:#f87171;padding:1rem;font-family:monospace;white-space:pre-wrap;font-size:12px">' +
          'Render error:\\n' + String(e.message) + '\\n\\n' + String(e.stack || '') + '</pre>';
        showErrors();
      }
    }

    mount();
  })();
  <\/script>
</body>
</html>`
}

// ─── Strategy C: Vue 3 ───────────────────────────────────────────────────────

function extractVueSections(vueContent) {
  const template = (vueContent.match(/<template>([\s\S]*?)<\/template>/) || [])[1] || ''
  const scriptMatch = vueContent.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/)
  const script = scriptMatch ? scriptMatch[1] : ''
  const styleMatch = vueContent.match(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/)
  const style = styleMatch ? styleMatch[1] : ''
  return { template, script, style }
}

function buildVuePreview(files, project) {
  const appVue =
    files.find((f) => f.path === 'src/App.vue') ||
    files.find((f) => f.path.toLowerCase().endsWith('/app.vue'))

  const styles = collectStyles(files)
  if (!appVue) return buildFallback(files, project, 'Vue')

  const { template, script, style } = extractVueSections(appVue.content || '')
  const cleanScript = script
    .replace(/import\s+.*?from\s+['"][^'"]+['"]\s*;?/gm, '')
    .trim()

  const tplLiteral = template.replace(/`/g, '\\`')
  let mountScript
  if (cleanScript.includes('export default')) {
    mountScript =
      cleanScript.replace('export default', 'var __vueOpts =') +
      '\n__vueOpts.template = `' + tplLiteral + '`;\nVue.createApp(__vueOpts).mount("#app");'
  } else {
    mountScript = 'Vue.createApp({ template: `' + tplLiteral + '` }).mount("#app");'
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${(project?.name || 'Preview').replace(/</g, '&lt;')}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"><\/script>
  <style>* { box-sizing:border-box; } body { margin:0; font-family:system-ui,sans-serif; } #app { min-height:100vh; } ${style}</style>
  ${styles}
</head>
<body>
  <div id="app"></div>
  <script>
    try { ${mountScript} }
    catch(e) {
      document.getElementById('app').innerHTML =
        '<pre style="color:#f87171;padding:1rem;font-family:monospace">⚠ Vue error:\\n'+e.message+'</pre>';
    }
  <\/script>
</body>
</html>`
}

// ─── Strategy D: Backend API Doc preview ─────────────────────────────────────

function parseRoutes(files, framework) {
  const routes = []

  if (framework === 'Node.js' || framework === 'Full-Stack') {
    const routeFiles = files.filter(
      (f) =>
        (f.path.endsWith('.js') || f.path.endsWith('.ts')) &&
        (f.path.includes('route') || f.path.includes('server') ||
         f.path.includes('api') || f.path.includes('controller'))
    )
    for (const file of routeFiles) {
      const content = file.content || ''
      for (const m of content.matchAll(
        /(?:app|router)\.(get|post|put|patch|delete|options)\s*\(\s*['"`]([^'"`]+)['"`]/gi
      )) {
        const lineIdx = content.slice(0, m.index).split('\n').length - 1
        const comment = (content.split('\n')[lineIdx - 1] || '').trim()
        const desc = comment.startsWith('//') ? comment.slice(2).trim() : ''
        routes.push({ method: m[1].toUpperCase(), path: m[2], desc, file: file.path })
      }
    }
  }

  if (framework === 'FastAPI' || framework === 'Django') {
    for (const file of files.filter((f) => f.path.endsWith('.py'))) {
      const content = file.content || ''
      for (const m of content.matchAll(
        /@(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/gi
      )) {
        routes.push({ method: m[1].toUpperCase(), path: m[2], desc: '', file: file.path })
      }
      for (const m of content.matchAll(/path\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)/gi)) {
        routes.push({ method: 'GET/POST', path: '/' + m[1], desc: 'Handler: ' + m[2], file: file.path })
      }
    }
  }

  if (framework === 'Laravel') {
    for (const file of files.filter((f) => f.path.endsWith('.php'))) {
      const content = file.content || ''
      for (const m of content.matchAll(
        /Route::(get|post|put|patch|delete|any)\s*\(\s*['"]([^'"]+)['"]/gi
      )) {
        routes.push({ method: m[1].toUpperCase(), path: m[2], desc: '', file: file.path })
      }
    }
  }

  return routes
}

const METHOD_COLORS = {
  GET: '#22c55e', POST: '#3b82f6', PUT: '#f59e0b',
  PATCH: '#8b5cf6', DELETE: '#ef4444', 'GET/POST': '#06b6d4', ANY: '#6b7280',
}

function buildBackendPreview(files, project) {
  const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const routes = parseRoutes(files, project?.framework)
  const sqlFile = files.find((f) => f.path.endsWith('.sql'))
  const readmeFile = files.find((f) => f.path.toLowerCase().includes('readme'))
  const codeFiles = files.filter((f) =>
    f.path.endsWith('.js') || f.path.endsWith('.ts') ||
    f.path.endsWith('.py') || f.path.endsWith('.php')
  ).length

  const routeRows = routes.length
    ? routes.map((r) => {
        const col = METHOD_COLORS[r.method] || '#6b7280'
        return `<div class="rrow">
          <span class="m" style="background:${col}22;color:${col};border:1px solid ${col}55">${esc(r.method)}</span>
          <code class="rp">${esc(r.path)}</code>
          <span class="rd">${esc(r.desc)}</span>
          <span class="rf">${esc(r.file)}</span>
        </div>`
      }).join('')
    : '<div style="color:#475569;padding:1rem;text-align:center;font-size:.8rem">No routes detected in source files</div>'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(project?.name)} — API Preview</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0a0a0f;color:#e2e8f0;font-family:system-ui,sans-serif}
    header{background:#11111c;border-bottom:1px solid rgba(255,255,255,.07);padding:1.25rem 2rem;display:flex;align-items:center;gap:1rem}
    .logo{width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#2563eb);display:flex;align-items:center;justify-content:center;font-size:1.1rem}
    .aname{font-size:1.15rem;font-weight:800}
    .fw{font-size:.7rem;font-weight:600;padding:.2rem .6rem;border-radius:999px;background:rgba(124,58,237,.2);color:#a78bfa;border:1px solid rgba(124,58,237,.3);margin-left:auto}
    .stats{display:flex;gap:1.5rem;padding:1rem 2rem;background:rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.05);flex-wrap:wrap}
    .sv{font-size:1.4rem;font-weight:800;color:#a78bfa}.sl{font-size:.65rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
    .content{max-width:1100px;margin:0 auto;padding:2rem}
    .section{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem}
    h2{font-size:1rem;font-weight:700;color:#94a3b8;margin-bottom:1rem}
    .rrow{display:grid;grid-template-columns:90px 1fr 1fr auto;gap:.75rem;align-items:center;padding:.6rem 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:.8rem}
    .rrow:last-child{border-bottom:none}
    .m{font-size:.65rem;font-weight:700;padding:.2rem .5rem;border-radius:4px;text-align:center}
    .rp{color:#e2e8f0;font-family:monospace}.rd{color:#64748b;font-size:.75rem}.rf{color:#475569;font-size:.65rem;font-family:monospace;text-align:right}
    pre{background:#0d0d18;border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:1rem;font-size:.72rem;color:#94a3b8;overflow-x:auto;white-space:pre;line-height:1.5;max-height:280px;overflow-y:auto}
    .fg{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:.4rem}
    .fc{font-size:.7rem;color:#475569;font-family:monospace;padding:.3rem .5rem;background:rgba(255,255,255,.02);border-radius:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e;display:inline-block;margin-right:.5rem;animation:p 2s infinite}
    @keyframes p{0%,100%{opacity:1}50%{opacity:.4}}
  </style>
</head>
<body>
  <header>
    <div class="logo">⚡</div>
    <div>
      <div class="aname">${esc(project?.name || 'API Server')}</div>
      <div style="font-size:.75rem;color:#64748b;margin-top:.1rem">${esc(project?.description || 'Backend API Preview')}</div>
    </div>
    <div class="fw">${esc(project?.framework || 'Backend')}</div>
  </header>
  <div class="stats">
    <div><div class="sv">${files.length}</div><div class="sl">Files</div></div>
    <div><div class="sv">${routes.length}</div><div class="sl">Endpoints</div></div>
    <div><div class="sv">${codeFiles}</div><div class="sl">Code Files</div></div>
    ${sqlFile ? '<div><div class="sv">1</div><div class="sl">SQL Schema</div></div>' : ''}
  </div>
  <div class="content">
    <div class="section" style="margin-bottom:1.5rem">
      <div style="font-size:.8rem;color:#64748b">
        <span class="dot"></span>API doc preview — endpoints parsed from source &nbsp;·&nbsp;
        <strong style="color:#a78bfa">${routes.length} routes detected</strong>
      </div>
    </div>
    <div class="section"><h2>🛣️ API Endpoints</h2>${routeRows}</div>
    ${sqlFile ? `<div class="section"><h2>📊 Database Schema</h2><pre>${esc(sqlFile.content)}</pre></div>` : ''}
    ${readmeFile ? `<div class="section"><h2>📖 README</h2><pre style="white-space:pre-wrap;font-family:system-ui;line-height:1.6">${esc(readmeFile.content)}</pre></div>` : ''}
    <div class="section">
      <h2>📁 Project Files</h2>
      <div class="fg">
        ${files.slice(0, 48).map((f) => `<div class="fc" title="${esc(f.path)}">📄 ${esc(f.path)}</div>`).join('')}
        ${files.length > 48 ? `<div class="fc" style="color:#7c3aed">+${files.length - 48} more</div>` : ''}
      </div>
    </div>
  </div>
</body>
</html>`
}

// ─── Strategy E: Fallback ─────────────────────────────────────────────────────

function buildFallback(files, project, framework) {
  const esc = (s) => (s || '').replace(/</g, '&lt;')
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>body{margin:0;background:#0a0a0f;color:#f8fafc;font-family:system-ui,sans-serif}</style>
</head>
<body class="min-h-screen flex items-center justify-center p-8">
  <div class="max-w-lg w-full text-center">
    <div class="inline-flex items-center gap-2 text-xs font-semibold text-violet-400 bg-violet-400/10 border border-violet-400/20 rounded-full px-3 py-1 mb-6">⚡ IkoBuild Preview</div>
    <h1 class="text-3xl font-black bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent mb-2">${esc(project?.name || 'Your App')}</h1>
    <p class="text-slate-400 text-sm mb-6">${framework ? esc(framework) + ' project' : 'Project'} — download the ZIP to run locally</p>
    <div class="bg-white/3 border border-white/8 rounded-xl p-4 text-left">
      <div class="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">Generated Files (${files.length})</div>
      ${files.slice(0, 20).map((f) => `<div class="font-mono text-xs text-slate-400 py-1 border-b border-white/4 last:border-0">📄 ${esc(f.path)}</div>`).join('')}
      ${files.length > 20 ? `<div class="font-mono text-xs text-violet-400 pt-1">+${files.length - 20} more</div>` : ''}
    </div>
    <div class="mt-4 text-xs text-slate-600">Run: <code class="text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">npm install &amp;&amp; npm run dev</code></div>
  </div>
</body>
</html>`
}

// ─── Master Dispatcher ────────────────────────────────────────────────────────

function buildSmartPreview(files, project) {
  if (!files || files.length === 0) return buildFallback([], project, project?.framework)

  const fw = project?.framework || ''
  const hasIndexHtml = files.some((f) => f.path === 'index.html' || f.path === 'public/index.html')

  if (fw === 'React' || fw === 'Next.js') return buildReactPreview(files, project)

  if (fw === 'Full-Stack') {
    const hasJsx = files.some((f) => f.path.startsWith('src/') && (f.path.endsWith('.jsx') || f.path.endsWith('.tsx')))
    return hasJsx ? buildReactPreview(files, project) : buildBackendPreview(files, project)
  }

  if (fw === 'Vue') return buildVuePreview(files, project)

  if (fw === 'Node.js' || fw === 'Django' || fw === 'FastAPI' || fw === 'Laravel') {
    return buildBackendPreview(files, project)
  }

  if (hasIndexHtml) return buildHtmlPreview(files)

  return buildFallback(files, project, fw)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PreviewFrame() {
  const { files, project } = useProjectStore()
  const [key, setKey] = useState(0)
  const [activeTab, setActiveTab] = useState('preview')
  const iframeRef = useRef(null)

  const refresh = () => setKey((k) => k + 1)
  const previewHtml = buildSmartPreview(files, project)

  const engineLabel =
    project?.framework === 'React' || project?.framework === 'Next.js' ? 'Babel + React 18' :
    project?.framework === 'Full-Stack' ? 'React 18 / API Docs' :
    project?.framework === 'Vue' ? 'Vue 3 CDN' :
    ['Node.js', 'Django', 'FastAPI', 'Laravel'].includes(project?.framework || '') ? 'API Doc Parser' :
    'HTML renderer'

  const buildLogs = [
    { level: 'info',    msg: `Project: ${project?.name || 'Untitled'}` },
    { level: 'info',    msg: `Framework: ${project?.framework || 'Unknown'}` },
    { level: 'success', msg: `Loaded ${files.length} source files` },
    { level: 'info',    msg: `Engine: ${engineLabel}` },
    { level: 'success', msg: 'Preview ready ✓' },
  ]

  return (
    <div className="flex flex-col h-full bg-[#0d0d13]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-glass bg-surface-300 flex-shrink-0">
        <div className="flex items-center gap-1 mr-2">
          {['preview', 'logs'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-all ${
                activeTab === t
                  ? 'bg-brand-600/20 text-brand-300'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {t === 'logs' ? '📋 Build Logs' : '🌐 Live Preview'}
            </button>
          ))}
        </div>

        <div className="flex-1 flex items-center gap-2 bg-white/4 rounded-lg px-3 py-1.5 border border-white/6 text-xs font-mono text-slate-500">
          <Wifi size={11} />
          <span className="truncate">
            {project?.name
              ? `${project.name.toLowerCase().replace(/\s+/g, '-')}.ikobuild.app`
              : 'preview.ikobuild.app'}
          </span>
          {project?.framework && (
            <span className="ml-auto text-slate-600 text-[10px] font-sans shrink-0">
              {engineLabel}
            </span>
          )}
        </div>

        <button
          onClick={refresh}
          className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-white/8 transition-all"
          title="Refresh preview"
        >
          <RefreshCw size={14} />
        </button>
        <button
          onClick={() => {
            const w = window.open('', '_blank')
            if (w) { w.document.write(previewHtml); w.document.close() }
          }}
          className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-white/8 transition-all"
          title="Open in new tab"
        >
          <ExternalLink size={14} />
        </button>
      </div>

      {/* Content */}
      {activeTab === 'preview' ? (
        <div className="flex-1 relative bg-white">
          {files.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d13] flex-col gap-3 text-slate-600">
              <AlertTriangle size={32} />
              <p className="text-sm">No files generated yet</p>
            </div>
          ) : (
            <iframe
              key={key}
              ref={iframeRef}
              srcDoc={previewHtml}
              title="App Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-[#0d0d13] p-4 font-mono text-xs">
          <div className="flex items-center gap-2 mb-4 text-slate-400">
            <Terminal size={14} />
            <span className="font-semibold">Build Logs</span>
          </div>
          {buildLogs.map((log, i) => (
            <div key={i} className="flex items-start gap-3 mb-2">
              <span className="text-slate-600 flex-shrink-0">[{String(i).padStart(2, '0')}:{String(i * 12).padStart(2, '0')}]</span>
              <span className={
                log.level === 'success' ? 'text-emerald-400' :
                log.level === 'error'   ? 'text-red-400' :
                log.level === 'warn'    ? 'text-yellow-400' : 'text-slate-400'
              }>
                {log.level === 'success' ? '✓' : '›'} {log.msg}
              </span>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-glass text-slate-600">
            <span className="text-emerald-400">●</span>{' '}
            <span className="text-brand-400">{engineLabel}</span>
          </div>
        </div>
      )}
    </div>
  )
}
