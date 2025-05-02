/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly VITE_SIGNALING_URL?: string;
    readonly [key: string]: string | undefined;
  };
}