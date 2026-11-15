/**
 * Face capture quality checks from Vision Section 9:
 * - Mean pixel brightness > 50/255
 * - Laplacian variance > 100
 * - Face confidence > 0.9
 * - Passive liveness > 0.8
 *
 * A screen capture or static image must be rejected.
 * This module provides the pure validation logic.
 * Actual camera capture + ML models are integrated on the client.
 */

export type FaceQualityInput = {
  meanBrightness: number;      // 0-255
  laplacianVariance: number;
  faceConfidence: number;      // 0-1
  passiveLiveness: number;     // 0-1
};

export type FaceQualityResult = {
  passed: boolean;
  reasons: string[];
};

export function validateFaceCapture(input: FaceQualityInput): FaceQualityResult {
  const reasons: string[] = [];

  if (input.meanBrightness <= 50) {
    reasons.push("Image too dark (brightness must be > 50/255)");
  }
  if (input.laplacianVariance <= 100) {
    reasons.push("Image not sharp enough (Laplacian variance must be > 100)");
  }
  if (input.faceConfidence <= 0.9) {
    reasons.push("Face not detected with sufficient confidence (> 0.9 required)");
  }
  if (input.passiveLiveness <= 0.8) {
    reasons.push("Liveness check failed (passive liveness must be > 0.8). Live capture required.");
  }

  return {
    passed: reasons.length === 0,
    reasons,
  };
}
