// Photorealistic Asset & Texture Pipeline for Anaconda Amazon Survival
class GameAssets {
  constructor() {
    this.loader = new THREE.TextureLoader();
    this.textures = {};
    this.isLoaded = false;
  }

  loadAll(onProgress, onComplete) {
    // 1. High-Resolution Production Maps
    const urls = {
      snakeSkin: 'assets/art/swallowing_bulge.jpg',
      snakeHead: 'assets/art/anaconda_model.jpg',
      caimanBoss: 'assets/art/black_caiman_boss.jpg',
      faunaSheet: 'assets/art/prey_fauna.jpg',
      terrainLevel1: 'assets/art/marajo_island.jpg',
      terrainLevel2: 'assets/art/tapajos_basin.jpg',
      terrainLevel3: 'assets/art/flooded_forest.jpg',
      hudFrame: 'assets/art/tactical_hud.jpg'
    };

    let total = Object.keys(urls).length;
    let loaded = 0;

    const checkComplete = () => {
      loaded++;
      if (onProgress) onProgress(loaded / total);
      if (loaded >= total) {
        this.sliceFaunaSheet();
        this.configureTextures();
        this.isLoaded = true;
        if (onComplete) onComplete();
      }
    };

    for (const [key, url] of Object.entries(urls)) {
      this.loader.load(
        url,
        (tex) => {
          this.textures[key] = tex;
          checkComplete();
        },
        undefined,
        (err) => {
          console.warn(`Failed to load ${url}, generating procedural fallback`, err);
          checkComplete();
        }
      );
    }
  }

  sliceFaunaSheet() {
    const sheet = this.textures.faunaSheet;
    if (!sheet || !sheet.image) return;

    const img = sheet.image;
    const w = img.naturalWidth || img.width || 1024;
    const h = img.naturalHeight || img.height || 576;
    const halfW = Math.floor(w / 2);
    const halfH = Math.floor(h / 2);

    const sliceQuadrant = (sx, sy, sw, sh) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 512, 512);
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    };

    // Slice 4 quadrants: Top-Left=Capybara, Top-Right=Frog, Bottom-Left=Rat, Bottom-Right=Caiman
    this.textures.capybara = sliceQuadrant(0, 0, halfW, halfH);
    this.textures.frog = sliceQuadrant(halfW, 0, halfW, halfH);
    this.textures.rat = sliceQuadrant(0, halfH, halfW, halfH);
    this.textures.caiman = sliceQuadrant(halfW, halfH, halfW, halfH);
  }

  configureTextures() {
    // Enable seamless wrapping and maximum sharpness
    for (const [key, tex] of Object.entries(this.textures)) {
      if (tex && tex.isTexture) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
      }
    }

    if (this.textures.snakeSkin) {
      this.textures.snakeSkin.repeat.set(3, 12);
    }
    if (this.textures.terrainLevel1) {
      this.textures.terrainLevel1.repeat.set(4, 4);
    }
    if (this.textures.terrainLevel2) {
      this.textures.terrainLevel2.repeat.set(8, 8);
    }
  }
}

window.GameAssets = GameAssets;
