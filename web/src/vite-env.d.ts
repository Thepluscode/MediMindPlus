/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_WS_URL: string
    readonly VITE_STRIPE_PUBLIC_KEY: string
    readonly VITE_STRIPE_PUBLISHABLE_KEY: string
    readonly DEV: boolean
    readonly PROD: boolean
    readonly MODE: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
