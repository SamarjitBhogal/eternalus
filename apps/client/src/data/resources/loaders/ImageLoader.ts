/** Decodes browser images through ResourceController. */
export class ImageLoader {
  /** Resolves when the image is ready for rendering. */
  public load(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve(image);
      };
      image.onerror = () => {
        reject(new Error(`Unable to load image: ${url}`));
      };
      image.src = url;
    });
  }
}
