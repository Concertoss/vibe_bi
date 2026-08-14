declare module "wujie-react" {
  import type { ComponentType, CSSProperties, ReactNode } from "react";

  export type WujieReactProps = {
    width?: string | number;
    height?: string | number;
    name: string;
    url: string;
    sync?: boolean;
    alive?: boolean;
    props?: Record<string, unknown>;
    fetch?: typeof window.fetch;
    replace?: (url: string) => string;
    fiber?: boolean;
    degrade?: boolean;
    plugins?: unknown[];
    beforeLoad?: () => void;
    beforeMount?: () => void;
    afterMount?: () => void;
    beforeUnmount?: () => void;
    afterUnmount?: () => void;
    activated?: () => void;
    deactivated?: () => void;
    loadError?: (url: string, e: Error) => void;
    children?: ReactNode;
    style?: CSSProperties;
    className?: string;
  };

  const WujieReact: ComponentType<WujieReactProps>;
  export default WujieReact;
}
