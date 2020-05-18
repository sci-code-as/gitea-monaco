import { createOnigScanner, createOnigString, loadWASM } from 'vscode-oniguruma';
import { INITIAL, Registry, parseRawGrammar } from 'vscode-textmate';
import DARK_VISUAL_STUDIO from './dark_vs.js';

export async function createGrammarStore(scopeNameToTextMateGrammarURL) {
  const registry = await createRegistry(scopeNameToTextMateGrammarURL);
  return new GrammarStore(registry);
}

class GrammarStore {
  constructor(registry) {
    this.registry = registry;
    this.scopeNameToGrammar = new Map();
  }
  // https://github.com/NeekSandhu/monaco-editor-textmate/issues/11#issuecomment-561984387
  // provides some insight as to why this isn't working.
  async createEncodedTokensProvider(scopeName) {
    const grammar = await this.getGrammar(scopeName);
    if (grammar == null) {
      throw Error(`no grammar for ${scopeName}`);
    }
    return {
      getInitialState() {
        return INITIAL;
      },
      tokenizeEncoded(line, state) {
        const tokenizeLineResult2 = grammar.tokenizeLine2(line, state);
        const endState = tokenizeLineResult2.ruleStack;
        const { tokens } = tokenizeLineResult2;
        return { tokens, endState };
      },
    };
  }
  async getGrammar(scopeName) {
    const grammar = this.scopeNameToGrammar.get(scopeName);
    if (grammar != null) {
      return grammar;
    }
    const promise = this.registry.loadGrammar(scopeName);
    this.scopeNameToGrammar.set(scopeName, promise);
    return promise;
  }
}
async function createRegistry(scopeNameToTextMateGrammarURL) {
  const data = await loadVSCodeOnigurumWASM();
  loadWASM(data);
  return new Registry({
    onigLib: Promise.resolve({
      createOnigScanner,
      createOnigString,
    }),
    async loadGrammar(scopeName) {
      const url = scopeNameToTextMateGrammarURL.get(scopeName);
      if (url == null) {
        throw Error(`no URL for ${scopeName}`);
      }
      const response = await fetch(url);
      if (response.ok) {
        const content = await response.text();
        // If this is a JSON grammar, filePath must be specified with a `.json`
        // file extension or else parseRawGrammar() will assume it is a PLIST
        // grammar.
        const match = url.match(/\/([^\/]+\.json)$/);
        const filePath = match != null ? match[1] : undefined;
        return parseRawGrammar(content, filePath);
      }
      throw Error(`request to ${url} failed: ${response}`);
    },
    theme: DARK_VISUAL_STUDIO,
  });
}

async function loadVSCodeOnigurumWASM() {
  const response = await fetch('https://storage.cloud.google.com/giteaassets/onig.wasm?');
  const contentType = response.headers.get('content-type');
  if (contentType === 'application/wasm') {
    return response;
  }
  return await response.arrayBuffer();
}
