import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { WiresService } from './wires.service';
import { LogicLabModel } from '../models/types';
import { emptyModel } from '../models/empty-model';

@Injectable({
  providedIn: 'root'
})
export class InteractionService {
  private scene: THREE.Scene;
  private model: LogicLabModel = emptyModel;
  private nodesByName: { [key: string]: THREE.Object3D } = {};
  private wireList: any[] = [];
  private lastClicked?: string;
  private dragWire?: any;

  constructor(private wiresService: WiresService) {}

  initialize(scene: THREE.Scene, meshes: THREE.Object3D[]) {
    this.scene = scene;
    this.setupNodes(meshes);
  }

  private setupNodes(meshes: THREE.Object3D[]) {
    meshes.forEach(m => this.nodesByName[m.name] = m);
  }

  // ... implement rest of interaction logic from ll-interaction.js
}