export interface DetectionStats {
  rotation: number;
  method: string;
  confidence: number;
  fps: number;
  lastProcessTime: number;
}

export interface Detection {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  confidence: number;
  class: number;
}

export interface VideoConstraints {
  width: { ideal: number };
  height: { ideal: number };
  facingMode: "environment" | "user";
}
