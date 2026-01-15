export enum ArtStyle {
  ThreeD = '3D',
  TwoD = '2D',
}

export enum Framing {
  Portrait = 'PORTRAIT',
  FullBody = 'FULL_BODY',
}

export enum BackgroundOption {
  Studio = 'STUDIO',
  Campus = 'CAMPUS',
  Festive = 'FESTIVE',
}

export interface UserConfig {
  courseName: string;
  style: ArtStyle;
  framing: Framing;
  background: BackgroundOption;
}

export interface GeneratedResult {
  imageUrl: string; // Base64 data URL
}

export type LoadingState = 'idle' | 'uploading' | 'generating' | 'success' | 'error';