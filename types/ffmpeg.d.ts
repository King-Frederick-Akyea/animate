declare module '@ffmpeg/ffmpeg' {
  export interface FFmpegOptions {
    coreURL: string;
    wasmURL: string;
  }

  export interface FileData {
    buffer: ArrayBuffer;
    length: number;
  }

  export class FFmpeg {
    load(options: FFmpegOptions): Promise<void>;
    exec(args: string[]): Promise<void>;
    readFile(filename: string): Promise<FileData>;
    writeFile(filename: string, data: Uint8Array): Promise<void>;
    deleteFile(filename: string): Promise<void>;
  }
}

declare module '@ffmpeg/util' {
  export function fetchFile(url: string): Promise<Uint8Array>;
  export function toBlobURL(url: string, mimeType: string): Promise<string>;
}