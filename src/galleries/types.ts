export interface GalleryImage {
  url: string;
}

export interface Gallery {
  id: string;
  name: string;
  description: string;
  images: GalleryImage[];
  showOnLandingPage: boolean;
}

export interface GalleryInput {
  name: string;
  description: string;
  images: GalleryImage[];
  showOnLandingPage: boolean;
}
