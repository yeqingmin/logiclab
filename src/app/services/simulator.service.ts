import { Injectable } from '@angular/core';
import { LogicLabModel, Component } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class SimulatorService {
  private simFrame = 0;

  private gateOps = {
    AND: (signals: any, i0: string, i1: string) => Math.min(signals[i0], signals[i1]),
    NAND: (signals: any, i0: string, i1: string) => Math.min(signals[i0], signals[i1]) ? 0 : 1,
    OR: (signals: any, i0: string, i1: string) => Math.max(signals[i0], signals[i1]),
    NOR: (signals: any, i0: string, i1: string) => Math.max(signals[i0], signals[i1]) ? 0 : 1,
    XOR: (signals: any, i0: string, i1: string) => signals[i0] != signals[i1] ? 1 : 0,
    NOT: (signals: any, i0: string) => signals[i0] ? 0 : 1,
  };

  *simulate(model: LogicLabModel, debug: any, componentSignalChanged: (k: string, c: Component, signal: number) => void) {
    let frames: { [key: string]: number } = {};
    let signals: { [key: string]: number } = {};
    this.simFrame++;

    const co = model.components;
    const gates: { [key: string]: Component } = {};

    // Set all source voltages and frames
    for (let k in co) {
      const c = co[k];
      if (c.type === 'SOURCE') {
        frames[k] = this.simFrame;
        signals[k] = 1;
      } else if (c.type === 'GATE') {
        gates[k] = c;
      }
    }

    const wires = model.wires;
    let hadUpdate = true;

    if (co.SWITCH000 && (!co.SWITCH000.closed)) {
      hadUpdate = false;
    }

    const log: string[] = [];

    while (hadUpdate) {
      hadUpdate = false;
      const touchedGates: { [key: string]: boolean } = {};

      // Update the wires
      for (let i = 0; i < wires.length; i++) {
        const e = wires[i];
        const f0 = frames[e.pin0] | 0;
        const f1 = frames[e.pin1] | 0;
        
        if (f0 === f1) continue;
        
        hadUpdate = true;
        let from: string;
        let to: string;

        if (f0 < f1) {
          from = e.pin1;
          to = e.pin0;
        } else {
          from = e.pin0;
          to = e.pin1;
        }

        const cto = co[to];
        const cfrom = co[from];
        let sig = signals[from] | 0;
        let ftime = frames[from];

        if (cfrom.type === 'SWITCH' && !cfrom.closed) {
          sig = 0;
        }

        signals[to] = sig;
        frames[to] = ftime;
        componentSignalChanged(to, cto, sig);

        if (debug.debug) {
          log.push(`${from}-->${to},${sig},${this.simFrame}`);
        }

        yield;
      }

      // Update the gates
      if (!hadUpdate) {
        for (let k in gates) {
          const gate = gates[k];
          if (frames[k] !== this.simFrame) {
            if ((frames[gate.i0!] === this.simFrame) && (gate.i1 ? (frames[gate.i1] === this.simFrame) : true)) {
              frames[k] = this.simFrame;
              signals[gate.o0!] = this.gateOps[gate.op!](signals, gate.i0!, gate.i1!);
              frames[gate.o0!] = this.simFrame;
              hadUpdate = true;
            }
          }
        }

        if (!hadUpdate && debug.debug) {
          debug.element.innerText = log.join('\n');
        }
      }
    }

    for (let k in co) {
      const c = co[k];
      componentSignalChanged(k, c, signals[k]);
    }
  }
}