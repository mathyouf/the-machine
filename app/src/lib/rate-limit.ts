/**
 * Client-side rate limiter using a sliding window.
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canProceed(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    return this.timestamps.length < this.maxRequests;
  }

  record(): void {
    this.timestamps.push(Date.now());
  }

  tryProceed(): boolean {
    if (!this.canProceed()) return false;
    this.record();
    return true;
  }

  get remaining(): number {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }
}

// Shared rate limiters
export const textCardLimiter = new RateLimiter(10, 60_000); // 10 cards per minute
export const scrollEventLimiter = new RateLimiter(60, 60_000); // 60 events per minute
export const cameraFrameLimiter = new RateLimiter(30, 60_000); // 30 frames per minute
