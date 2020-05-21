// This sets up webpack's chunk loading to load resources from the 'public'
// directory. This file must be imported before any lazy-loading is being attempted.
const {StaticUrlPrefix} = window.config;
if (StaticUrlPrefix) {
  __webpack_public_path__ = StaticUrlPrefix.endsWith('/') ? StaticUrlPrefix : `${StaticUrlPrefix}/`;
} else {
  const url = new URL(document.currentScript.src);
  __webpack_public_path__ = url.pathname.replace(/\/[^/]*?\/[^/]*?$/, '/');
}
