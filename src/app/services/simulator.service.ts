import { Injectable } from '@angular/core';
import { LogicLabModel, Component } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class SimulatorService {
  private simFrame = 0;

  *simulate(model: LogicLabModel, debug: any, componentSignalChanged: (k: string, c: Component, signal: number) => void) {
    // Simulation logic from ll-simulator.js
    // ... implement simulation logic
  }

  private gateOps = {
    AND: (signals: any, i0: string, i1: string) => Math.min(signals[i0], signals[i1]),
    NAND: (signals: any, i0: string, i1: string) => Math.min(signals[i0], signals[i1]) ? 0 : 1,
    OR: (signals: any, i0: string, i1: string) => Math.max(signals[i0], signals[i1]),
    NOR: (signals: any, i0: string, i1: string) => Math.max(signals[i0], signals[i1]) ? 0 : 1,
    XOR: (signals: any, i0: string, i1: string) => signals[i0] != signals[i1] ? 1 : 0,
    NOT: (signals: any, i0: string) => signals[i0] ? 0 : 1,
  };
}