// Modular Amazon River & Rainforest Environment Generator
class AmazonWorld {
  constructor(scene) {
    this.scene = scene;
    this.worldSize = 240;
    this.waterLevel = 0.2;
    this.foliage = [];
    this.lilyPads = [];
    this.fallenLogs = [];

    this.initTerrain();
    this.initWater();
    this.initVegetation();
    this.initAtmosphere();
  }

  getHeightAt(x, z) {
    // Distance from world bounds
    if (Math.abs(x) > this.worldSize / 2 || Math.abs(z) > this.worldSize / 2) {
      return 6.0; // impenetrable border banks
    }

    // Winding river channel equation
    const riverCenter = Math.sin(z * 0.04) * 25 + Math.cos(z * 0.015) * 12;
    const distFromRiver = Math.abs(x - riverCenter);

    // River island at z = -20
    const islandDist = Math.hypot(x - riverCenter, z + 20);
    if (islandDist < 14) {
      return 0.8 + Math.cos(islandDist / 14 * Math.PI * 0.5) * 1.2;
    }

    // Second river outpost island at z = 45
    const island2Dist = Math.hypot(x - (riverCenter + 5), z - 45);
    if (island2Dist < 12) {
      return 0.7 + Math.cos(island2Dist / 12 * Math.PI * 0.5) * 0.9;
    }

    if (distFromRiver < 18) {
      // River channel bed
      const bedDepth = (1 - (distFromRiver / 18)) * 1.8;
      return -0.4 - bedDepth;
    } else if (distFromRiver < 28) {
      // Muddy shorelines slope
      const t = (distFromRiver - 18) / 10;
      return -0.4 + t * 1.6;
    } else {
      // High jungle floor with slight noise
      const baseJungle = 1.2;
      const noise = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.6;
      return baseJungle + noise + ((distFromRiver - 28) * 0.05);
    }
  }

  initTerrain() {
    const segments = 120;
    const geom = new THREE.PlaneGeometry(this.worldSize, this.worldSize, segments, segments);
    geom.rotateX(-Math.PI * 0.5);

    const pos = geom.attributes.position;
    const colors = [];
    const color = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getHeightAt(x, z);
      pos.setY(i, y);

      // Biome Elevation-based coloring
      if (y < 0.0) {
        // Murky underwater riverbed silt
        color.setRGB(0.12, 0.16, 0.11);
      } else if (y < 0.6) {
        // Wet muddy shoreline
        color.setRGB(0.24, 0.18, 0.12);
      } else if (y < 1.4) {
        // Rich Amazon riverbank moss & grass
        color.setRGB(0.18, 0.32, 0.14);
      } else {
        // Dense jungle canopy soil
        color.setRGB(0.14, 0.28, 0.10);
      }
      colors.push(color.r, color.g, color.b);
    }

    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05
    });

    this.terrainMesh = new THREE.Mesh(geom, terrainMat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  initWater() {
    const waterGeom = new THREE.PlaneGeometry(this.worldSize, this.worldSize, 40, 40);
    waterGeom.rotateX(-Math.PI * 0.5);

    // Murky tropical Amazon river water material
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x1a3328,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.82
    });

    this.waterMesh = new THREE.Mesh(waterGeom, this.waterMat);
    this.waterMesh.position.y = this.waterLevel;
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);
  }

  initVegetation() {
    this.foliageGroup = new THREE.Group();
    this.scene.add(this.foliageGroup);

    // Shared Trunk & Palm Materials
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3b2a1a, roughness: 0.9 });
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x22551e, roughness: 0.4, side: THREE.DoubleSide });
    const logMat = new THREE.MeshStandardMaterial({ color: 0x33281c, roughness: 0.95 });
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x2c4a1e, roughness: 0.7 });

    // 1. Scatter Palm Trees along riverbanks and jungle floor
    for (let i = 0; i < 90; i++) {
      const x = (Math.random() - 0.5) * (this.worldSize - 30);
      const z = (Math.random() - 0.5) * (this.worldSize - 30);
      const y = this.getHeightAt(x, z);

      // Only plant palms on dry land / shores
      if (y > 0.4) {
        const palm = this.createPalmTree(trunkMat, frondMat);
        palm.position.set(x, y, z);
        palm.rotation.y = Math.random() * Math.PI * 2;
        palm.scale.setScalar(0.8 + Math.random() * 0.6);
        this.foliageGroup.add(palm);
      }
    }

    // 2. Giant Victoria amazonica Lily Pads on calm river waters
    const lilyMat = new THREE.MeshStandardMaterial({
      color: 0x317332,
      roughness: 0.35,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 45; i++) {
      const z = (Math.random() - 0.5) * (this.worldSize - 40);
      const riverCenter = Math.sin(z * 0.04) * 25 + Math.cos(z * 0.015) * 12;
      const x = riverCenter + (Math.random() - 0.5) * 16;
      const y = this.getHeightAt(x, z);

      if (y < this.waterLevel) {
        const lily = this.createLilyPad(lilyMat);
        lily.position.set(x, this.waterLevel + 0.02, z);
        lily.rotation.y = Math.random() * Math.PI * 2;
        lily.scale.setScalar(1.2 + Math.random() * 1.5);
        this.scene.add(lily);
        this.lilyPads.push(lily);
      }
    }

    // 3. Fallen Mossy Logs Bridging the Riverbanks (Choke points)
    const logPositions = [
      { x: -5, z: -10, rotY: 0.4, length: 18 },
      { x: 12, z: 25, rotY: -0.3, length: 16 },
      { x: -18, z: -55, rotY: 0.6, length: 20 },
      { x: 5, z: 70, rotY: 0.1, length: 15 }
    ];

    for (const lp of logPositions) {
      const log = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.85, lp.length, 8),
        logMat
      );
      log.rotation.z = Math.PI * 0.5;
      log.rotation.y = lp.rotY;
      const groundY = this.getHeightAt(lp.x, lp.z);
      log.position.set(lp.x, Math.max(groundY, this.waterLevel) + 0.3, lp.z);
      log.castShadow = true;
      log.receiveShadow = true;
      this.scene.add(log);
      this.fallenLogs.push(log);

      // Moss patch on top of log
      const moss = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.15, lp.length * 0.7),
        mossMat
      );
      moss.position.set(lp.x, log.position.y + 0.6, lp.z);
      moss.rotation.y = lp.rotY;
      this.scene.add(moss);
    }
  }

  createPalmTree(trunkMat, frondMat) {
    const palm = new THREE.Group();
    const height = 9 + Math.random() * 4;

    // Curved trunk
    const trunkGeom = new THREE.CylinderGeometry(0.35, 0.65, height, 7);
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    palm.add(trunk);

    // Radial Fronds
    const crown = new THREE.Group();
    crown.position.y = height;
    const numFronds = 9;

    for (let f = 0; f < numFronds; f++) {
      const angle = (f / numFronds) * Math.PI * 2;
      const frondGeom = new THREE.ConeGeometry(0.9, 5.5, 4);
      frondGeom.scale(1, 0.15, 1);
      frondGeom.rotateX(Math.PI * 0.38); // drooping arch

      const frond = new THREE.Mesh(frondGeom, frondMat);
      frond.rotation.y = angle;
      crown.add(frond);
    }
    palm.add(crown);
    return palm;
  }

  createLilyPad(lilyMat) {
    const geom = new THREE.CylinderGeometry(1.2, 1.2, 0.05, 16);
    // Slight rim
    const mesh = new THREE.Mesh(geom, lilyMat);
    return mesh;
  }

  initAtmosphere() {
    // Ambient light
    const amb = new THREE.AmbientLight(0x284030, 1.4);
    this.scene.add(amb);

    // Directional Sun with jungle shadows
    this.sunLight = new THREE.DirectionalLight(0xfff3d0, 1.8);
    this.sunLight.position.set(40, 70, 30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 160;
    const d = 50;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);

    // Amazon Rainforest Depth Fog
    this.scene.fog = new THREE.FogExp2(0x0c2115, 0.012);
  }

  update(delta) {
    // Gentle water wave undulation
    if (this.waterMesh) {
      this.waterMesh.rotation.y = Math.sin(Date.now() * 0.0003) * 0.02;
    }
    for (let i = 0; i < this.lilyPads.length; i++) {
      const lily = this.lilyPads[i];
      lily.position.y = this.waterLevel + 0.02 + Math.sin(Date.now() * 0.0015 + i) * 0.015;
    }
  }
}

window.AmazonWorld = AmazonWorld;
