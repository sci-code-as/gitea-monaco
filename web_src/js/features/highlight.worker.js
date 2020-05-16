import {createWindow} from 'domino';

self.onmessage = function ({data}) {
  const window = createWindow();
  self.document = window.document;

  const {index, html} = data;
  document.body.innerHTML = html;
  Prism.highlightElement(document.body.firstChild, true);
  //highlightBlock(document.body.firstChild);
  self.postMessage({index, html: document.body.innerHTML});
};
