declare module "heic-convert" {
  interface ConvertOptions {
    /** Input HEIC/HEIF buffer */
    buffer: Buffer;
    /** Output format: "JPEG" or "PNG" */
    format: "JPEG" | "PNG";
    /** Quality from 0 to 1 (for JPEG) */
    quality?: number;
  }

  function heicConvert(options: ConvertOptions): Promise<ArrayBuffer>;

  export = heicConvert;
}
