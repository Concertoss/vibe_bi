/// <reference types="vite/client" />

export type WujieProps = {
  token?: string | null;
  user?: unknown;
  dataScope?: string[];
  reportCode?: string;
  proxyBase?: string;
};

declare global {
  interface Window {
    $wujie?: {
      props?: WujieProps;
      bus?: { $on: Function; $emit: Function; $off: Function };
    };
    // local standalone debug token
    __VIBEBI_LOCAL_TOKEN__?: string;
  }
}

export {};
