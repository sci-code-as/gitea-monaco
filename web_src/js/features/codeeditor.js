import {basename, extname, isObject, isDarkTheme} from '../utils.js';
import { createGrammarStore } from './monacowasm.js';


const languagesByFilename = {};
const languagesByExt = {};

function getEditorconfig(input) {
  try {
    return JSON.parse(input.dataset.editorconfig);
  } catch (_err) {
    return null;
  }
}

const grammarConfigurations = [
  { language: 'css', extension: '.css', scopeName: 'source.css', url: 'https://raw.githubusercontent.com/ozonep/gitea-monaco/tokenizers/web_src/js/features/grammars/css.tmLanguage.json' },
  { language: 'go', extension: '.go', scopeName: 'source.go', url: 'https://raw.githubusercontent.com/ozonep/gitea-monaco/tokenizers/web_src/js/features/grammars/go.tmLanguage.json' },
  { language: 'html', extension: '.html', scopeName: 'text.html.basic', url: 'https://raw.githubusercontent.com/ozonep/gitea-monaco/tokenizers/web_src/js/features/grammars/html.tmLanguage.json' },
  { language: 'javascript', extension: '.js', scopeName: 'source.js', url: 'https://raw.githubusercontent.com/ozonep/gitea-monaco/tokenizers/web_src/js/features/grammars/JavaScript.tmLanguage.json' },
  { language: 'javascriptreact', extension: '.jsx', scopeName: 'source.js.jsx', url: 'https://raw.githubusercontent.com/ozonep/gitea-monaco/tokenizers/web_src/js/features/grammars/JavaScriptReact.tmLanguage.json' },
  { language: 'json', extension: '.json', scopeName: 'source.json', url: 'https://raw.githubusercontent.com/ozonep/gitea-monaco/tokenizers/web_src/js/features/grammars/JSON.tmLanguage.json' },
  { language: 'python', extension: '.py', scopeName: 'source.python', url: 'https://raw.githubusercontent.com/ozonep/gitea-monaco/tokenizers/web_src/js/features/grammars/MagicPython.tmLanguage.json' },
  { language: 'markdown', extension: '.md', scopeName: 'text.html.markdown', url: 'https://raw.githubusercontent.com/ozonep/gitea-monaco/tokenizers/web_src/js/features/grammars/markdown.tmLanguage.json' },
  { language: 'typescript', extension: '.ts', scopeName: 'source.ts', url: 'https://raw.githubusercontent.com/ozonep/gitea-monaco/tokenizers/web_src/js/features/grammars/TypeScript.tmLanguage.json' },
  { language: 'yaml', extension: '.yaml', scopeName: 'source.yaml', url: 'https://raw.githubusercontent.com/ozonep/gitea-monaco/tokenizers/web_src/js/features/grammars/yaml.tmLanguage.json' },
];

async function registerEncodedTokensProviders(monaco) {
  const scopeNameToTextMateGrammarURL = new Map(grammarConfigurations.map(({ scopeName, url }) => [scopeName, url]));
  const grammarStore = await createGrammarStore(scopeNameToTextMateGrammarURL);
  for (const { language, scopeName } of grammarConfigurations) {
    const tokensProvider = await grammarStore.createEncodedTokensProvider(scopeName);
    monaco.languages.setTokensProvider(language, tokensProvider);
  }
}

async function initLanguages(monaco) {
  for (const { language, extension } of grammarConfigurations) {
    monaco.languages.register({
      id: language,
      extensions: [],
    });
    languagesByExt[extension] = language;
  }
  await registerEncodedTokensProviders(monaco);
}

function getLanguage(filename) {
  return languagesByFilename[filename] || languagesByExt[extname(filename)] || 'plaintext';
}

function updateEditor(monaco, editor, filenameInput) {
  const newFilename = filenameInput.value;
  editor.updateOptions(getOptions(filenameInput));
  const model = editor.getModel();
  const language = model.getModeId();
  const newLanguage = getLanguage(newFilename);
  if (language !== newLanguage) monaco.editor.setModelLanguage(model, newLanguage);
}

export async function createCodeEditor(textarea, filenameInput, previewFileModes) {
  const filename = basename(filenameInput.value);
  const previewLink = document.querySelector('a[data-tab=preview]');
  const markdownExts = (textarea.dataset.markdownFileExts || '').split(',');
  const lineWrapExts = (textarea.dataset.lineWrapExtensions || '').split(',');
  const isMarkdown = markdownExts.includes(extname(filename));

  if (previewLink) {
    if (isMarkdown && (previewFileModes || []).includes('markdown')) {
      previewLink.dataset.url = previewLink.dataset.url.replace(/(.*)\/.*/i, `$1/markdown`);
      previewLink.style.display = '';
    } else {
      previewLink.style.display = 'none';
    }
  }

  //const monaco = await import(/* webpackChunkName: "monaco" */'monaco-editor/esm/vs/editor/editor.api');
  const monaco = await import('monaco-editor/esm/vs/editor/editor.api');

  await initLanguages(monaco);

  const container = document.createElement('div');
  container.className = 'monaco-editor-container';
  textarea.parentNode.appendChild(container);

  const editor = monaco.editor.create(container, {
    value: textarea.value,
    language: getLanguage(filename),
    minimap: {
      enabled: false,
    },
    ...getOptions(filenameInput, lineWrapExts),
  });

  const model = editor.getModel();
  model.onDidChangeContent(() => {
    textarea.value = editor.getValue();
    textarea.dispatchEvent(new Event('change')); // seems to be needed for jquery-are-you-sure
  });

  window.addEventListener('resize', () => {
    editor.layout();
  });

  filenameInput.addEventListener('keyup', () => {
    updateEditor(monaco, editor, filenameInput);
  });

  const loading = document.querySelector('.editor-loading');
  if (loading) loading.remove();

  return editor;
}

function getOptions(filenameInput, lineWrapExts) {
  const ec = getEditorconfig(filenameInput);
  const theme = isDarkTheme() ? 'vs-dark' : 'vs';
  const wordWrap = (lineWrapExts || []).includes(extname(filenameInput.value)) ? 'on' : 'off';

  const opts = {theme, wordWrap};
  if (isObject(ec)) {
    opts.detectIndentation = !('indent_style' in ec) || !('indent_size' in ec);
    if ('indent_size' in ec) opts.indentSize = Number(ec.indent_size);
    if ('tab_width' in ec) opts.tabSize = Number(ec.tab_width) || opts.indentSize;
    if ('max_line_length' in ec) opts.rulers = [Number(ec.max_line_length)];
    opts.trimAutoWhitespace = ec.trim_trailing_whitespace === true;
    opts.insertSpaces = ec.indent_style === 'space';
    opts.useTabStops = ec.indent_style === 'tab';
  }

  return opts;
}
