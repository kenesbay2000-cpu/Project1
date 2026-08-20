const DEFAULT_QUALITY = 80;

export function optimizedDestinationImage(image: string, width: number, quality = DEFAULT_QUALITY) {
  try {
    const url = new URL(image);
    if (url.hostname !== 'images.unsplash.com') return image;
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', String(quality));
    return url.toString();
  } catch {
    return image;
  }
}

export function destinationPreviewSrcSet(image: string) {
  return [640, 960, 1440]
    .map((width) => `${optimizedDestinationImage(image, width)} ${width}w`)
    .join(', ');
}

export function destinationHeroSrcSet(image: string) {
  return [960, 1600, 2200]
    .map((width) => `${optimizedDestinationImage(image, width, 82)} ${width}w`)
    .join(', ');
}
