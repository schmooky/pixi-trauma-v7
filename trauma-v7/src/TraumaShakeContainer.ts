import { Container } from 'pixi.js';
import {createNoise2D, NoiseFunction2D } from 'simplex-noise';

export interface ShakeSettings {
  amplitude: number;
  traumaPower: number;
  decayPerSecond: number;
  frequency: number;
  octaves: number;
}

export const DEFAULT_SHAKE_SETTINGS: ShakeSettings = {
  amplitude: 100,
  traumaPower: 2,
  decayPerSecond: 0.94,
  frequency: 15,
  octaves: 1,
};

export class TraumaShakeContainer extends Container {
  private trauma: number = 0;
  private referencePosition: { x: number; y: number } | null = null;
  private settings: ShakeSettings;
  private noise: NoiseFunction2D;
  private elapsedTime: number = 0;

  constructor(settings: Partial<ShakeSettings> = {}) {
    super();
    this.settings = { ...DEFAULT_SHAKE_SETTINGS, ...settings };
    this.noise = createNoise2D();
  }

  public addTrauma(amount: number): void {
    this.trauma = Math.min(Math.max(this.trauma + amount, 0), 1);
  }

  public update(deltaTimeMS: number): void {
    const deltaTime = deltaTimeMS / 60

    this.elapsedTime += deltaTime;

    // Decay trauma over time
    this.trauma = Math.max(
      this.trauma - this.settings.decayPerSecond * deltaTime,
      0
    );

    // Store reference position if not set
    if (!this.referencePosition) {
      this.referencePosition = { x: this.position.x, y: this.position.y };
    }

    // Calculate trauma amount
    const traumaAmount = Math.pow(this.trauma, this.settings.traumaPower);

    // Reset to reference position
    if (this.referencePosition) {
      this.position.x = this.referencePosition.x;
      this.position.y = this.referencePosition.y;
    }

    // Apply shake if there's trauma
    if (traumaAmount > 0) {
      const noiseX = this.fbmNoise(
        this.settings.frequency * this.elapsedTime,
        1,
        this.settings.octaves
      );
      const noiseY = this.fbmNoise(
        this.settings.frequency * this.elapsedTime,
        2,
        this.settings.octaves
      );

      const offsetX = this.settings.amplitude * traumaAmount * noiseX;
      const offsetY = this.settings.amplitude * traumaAmount * noiseY;

      this.position.x += offsetX;
      this.position.y += offsetY;
    }
  }

  private fbmNoise(x: number, y: number, octaves: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    const lacunarity = 2;
    const gain = 0.5;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise(x * frequency, y);
      amplitude *= gain;
      frequency *= lacunarity;
    }

    return value;
  }

  public getTrauma(): number {
    return this.trauma;
  }

  public updateSettings(newSettings: Partial<ShakeSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }
}