export enum ArtStyle {
  ThreeD = '3D',
  TwoD = '2D',
}

export enum Framing {
  Portrait = 'PORTRAIT',
  FullBody = 'FULL_BODY',
}

export interface UserConfig {
  courseName: string;
  style: ArtStyle;
  framing: Framing;
}

export interface GeneratedResult {
  imageUrl: string; // Base64 data URL
}

export type LoadingState = 'idle' | 'uploading' | 'generating' | 'success' | 'error';
