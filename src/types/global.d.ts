// Global type declarations

declare global {
  interface Navigator {
    mediaDevices: MediaDevices;
  }

  interface MediaDevices {
    getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
  }

  interface HTMLVideoElement {
    srcObject: MediaStream | null;
    videoWidth: number;
    videoHeight: number;
  }

  interface HTMLCanvasElement {
    getContext(contextId: "2d"): CanvasRenderingContext2D | null;
  }

  interface CanvasRenderingContext2D {
    drawImage(
      image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
      dx: number,
      dy: number
    ): void;
    drawImage(
      image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
      dx: number,
      dy: number,
      dw: number,
      dh: number
    ): void;
  }

  interface MediaStreamTrack {
    stop(): void;
  }

  interface MediaStream {
    getTracks(): MediaStreamTrack[];
  }
}

// Extend window object for potential future use
declare interface Window {
  webkitRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
  mozRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
  msRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
}

// Type for environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    PYTHON_BACKEND_URL?: string;
    NODE_ENV: "development" | "production" | "test";
  }
}

export {};
