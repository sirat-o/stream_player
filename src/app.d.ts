// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  interface Window {}

  // Define the shape of your object
  interface StreamFormData {
    streamUrl: string;
    streamType: string;
    cookie: string;
    referer: string;
    origin: string;
    userAgent: string;
    drmScheme: string;
    clearKey: string;
    licenseUrl: string;
    licenseHeaders: string;
    certificateUrl: string;
    certificateHeaders: string;
    requestHeaders: string;
    shakaConfig: string;
  }
}

export {};
