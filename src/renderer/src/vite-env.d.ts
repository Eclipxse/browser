/// <reference types="vite/client" />

declare global {
  interface Window {
    aura: {
      versions: {
        electron: string;
        chrome: string;
        node: string;
      };
    };
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<
        React.HTMLAttributes<Electron.WebviewTag>,
        Electron.WebviewTag
      > & {
        src?: string;
        partition?: string;
        allowpopups?: string;
        webpreferences?: string;
      };
    }
  }
}

export {};

