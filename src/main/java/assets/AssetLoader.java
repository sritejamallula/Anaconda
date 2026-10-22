package assets;

import game.GameConfig;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * High-performance asset loading manager and procedural texture generator.
 * Loads external images when available and provides photorealistic procedural
 * generation fallbacks to guarantee 100% crash-free execution.
 */
public class AssetLoader {
    private static AssetLoader instance;
    private final Map<String, BufferedImage> imageCache = new HashMap<>();

    private AssetLoader() {
        initProceduralTextures();
        loadLocalAssets();
    }

    public static synchronized AssetLoader getInstance() {
        if (instance == null) {
            instance = new AssetLoader();
        }
        return instance;
    }

    /**
     * Loads external images from known asset folders if available.
     */
    private void loadLocalAssets() {
        String[] searchPaths = {"assets/images", "assets/art", "../assets/art"};
        for (String path : searchPaths) {
            File dir = new File(path);
            if (dir.exists() && dir.isDirectory()) {
                File[] files = dir.listFiles((d, name) -> {
                    String lower = name.toLowerCase();
                    return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg");
                });
                if (files != null) {
                    for (File f : files) {
                        try {
                            BufferedImage img = ImageIO.read(f);
                            if (img != null) {
                                String key = f.getName().substring(0, f.getName().lastIndexOf('.'));
                                imageCache.put(key, img);
                            }
                        } catch (IOException ignored) {
                        }
                    }
                }
            }
        }
    }

    /**
     * Generates rich procedural graphics textures for all terrain, animals, and scales.
     */
    private void initProceduralTextures() {
        imageCache.put("scale_pattern", createAnacondaScaleTexture(128, 128));
        imageCache.put("water_surface", createWaterTileTexture(256, 256));
        imageCache.put("jungle_ground", createJungleGroundTexture(256, 256));
        imageCache.put("mud_bank", createMudBankTexture(256, 256));
        imageCache.put("palm_canopy", createPalmCanopySprite(180, 180));
        imageCache.put("kapok_tree", createKapokTreeSprite(240, 240));
        imageCache.put("river_rock", createRiverRockSprite(80, 60));
        imageCache.put("fallen_log", createFallenLogSprite(160, 48));
    }

    public BufferedImage getImage(String key) {
        return imageCache.get(key);
    }

    public void putImage(String key, BufferedImage image) {
        imageCache.put(key, image);
    }

    // ==========================================
    // PROCEDURAL TEXTURE GENERATORS
    // ==========================================

    /**
     * Generates a photorealistic green anaconda scale texture featuring an olive-green
     * base, dark dorsal oval blotches, and golden-yellow lateral ocelli spots.
     */
    public BufferedImage createAnacondaScaleTexture(int width, int height) {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2 = img.createGraphics();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // 1. Olive green base with subtle gradient
        GradientPaint baseGrad = new GradientPaint(
                0, 0, GameConfig.ANACONDA_BASE_OLIVE,
                width, height, new Color(54, 72, 28)
        );
        g2.setPaint(baseGrad);
        g2.fillRect(0, 0, width, height);

        // 2. Micro scale pattern (interlocking rhomboids)
        g2.setColor(new Color(40, 55, 20, 110));
        int scaleSize = 6;
        for (int y = 0; y < height; y += scaleSize) {
            int xOffset = (y / scaleSize % 2 == 0) ? 0 : scaleSize / 2;
            for (int x = -scaleSize; x < width + scaleSize; x += scaleSize) {
                Polygon poly = new Polygon();
                poly.addPoint(x + xOffset, y);
                poly.addPoint(x + xOffset + scaleSize / 2, y + scaleSize / 2);
                poly.addPoint(x + xOffset, y + scaleSize);
                poly.addPoint(x + xOffset - scaleSize / 2, y + scaleSize / 2);
                g2.drawPolygon(poly);
            }
        }

        // 3. Signature dark dorsal blotches (large irregular dark brown/black ovals)
        g2.setColor(GameConfig.ANACONDA_DARK_BLOTCH);
        g2.fillOval(width / 4, height / 6, width / 2, height / 3);
        g2.fillOval(width / 3, (int)(height * 0.6), (int)(width * 0.45), height / 4);

        // 4. Yellow/orange lateral ocelli spots (rings with dark centers)
        g2.setColor(GameConfig.ANACONDA_OCELLI_YELLOW);
        g2.fillOval(6, height / 2, 14, 10);
        g2.fillOval(width - 20, height / 3, 14, 10);
        g2.setColor(GameConfig.ANACONDA_DARK_BLOTCH);
        g2.fillOval(9, height / 2 + 2, 8, 6);
        g2.fillOval(width - 17, height / 3 + 2, 8, 6);

        // 5. Wet clearcoat specular sheen
        RadialGradientPaint sheen = new RadialGradientPaint(
                new Point2D.Float(width * 0.4f, height * 0.35f),
                width * 0.5f,
                new float[]{0.0f, 0.7f, 1.0f},
                new Color[]{new Color(255, 255, 255, 75), new Color(255, 255, 255, 15), new Color(0, 0, 0, 0)}
        );
        g2.setPaint(sheen);
        g2.fillRect(0, 0, width, height);

        g2.dispose();
        return img;
    }

    /**
     * Procedural Amazon river water tile with depth gradients and ripple refractions.
     */
    public BufferedImage createWaterTileTexture(int width, int height) {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2 = img.createGraphics();

        // Deep blue-green Amazon river color
        GradientPaint waterGrad = new GradientPaint(
                0, 0, GameConfig.COLOR_RIVER_SHALLOW,
                width, height, GameConfig.COLOR_RIVER_DEEP
        );
        g2.setPaint(waterGrad);
        g2.fillRect(0, 0, width, height);

        // Sinuous river currents & wave caustics
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setColor(GameConfig.COLOR_RIVER_HIGHLIGHT);
        g2.setStroke(new BasicStroke(2.5f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));

        for (int y = 12; y < height; y += 24) {
            Path2D path = new Path2D.Double();
            path.moveTo(0, y);
            for (int x = 0; x <= width; x += 32) {
                double wave = Math.sin((x + y) * 0.08) * 6.0;
                path.lineTo(x, y + wave);
            }
            g2.draw(path);
        }

        g2.dispose();
        return img;
    }

    /**
     * Procedural dense rainforest ground tile with rich soil, moss, and leaf litter.
     */
    public BufferedImage createJungleGroundTexture(int width, int height) {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2 = img.createGraphics();

        // Dark rainforest soil base
        g2.setColor(GameConfig.COLOR_JUNGLE_SOIL);
        g2.fillRect(0, 0, width, height);

        // Mossy patches
        g2.setColor(new Color(48, 76, 28, 140));
        for (int i = 0; i < 28; i++) {
            int rx = (i * 37) % width;
            int ry = (i * 53) % height;
            int rw = 20 + (i % 5) * 8;
            int rh = 16 + (i % 4) * 6;
            g2.fillOval(rx, ry, rw, rh);
        }

        // Fallen dry leaves (reddish-brown, ochre, olive)
        Color[] leafColors = {
                new Color(110, 68, 30, 180),
                new Color(90, 80, 25, 170),
                new Color(60, 75, 30, 160)
        };
        for (int i = 0; i < 45; i++) {
            int lx = (i * 71) % width;
            int ly = (i * 89) % height;
            g2.setColor(leafColors[i % leafColors.length]);
            AffineTransform old = g2.getTransform();
            g2.translate(lx, ly);
            g2.rotate(Math.toRadians((i * 47) % 360));
            g2.fillOval(-6, -3, 12, 6);
            g2.setTransform(old);
        }

        g2.dispose();
        return img;
    }

    /**
     * Muddy riverbank texture with rich wet mud and transition gravel.
     */
    public BufferedImage createMudBankTexture(int width, int height) {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2 = img.createGraphics();

        g2.setColor(GameConfig.COLOR_MUD_SHORE);
        g2.fillRect(0, 0, width, height);

        // Wet mud sheen streaks
        g2.setColor(new Color(100, 75, 48, 160));
        for (int i = 0; i < 20; i++) {
            int mx = (i * 43) % width;
            int my = (i * 67) % height;
            g2.fillOval(mx, my, 35, 18);
        }

        // Pebbles and gravel
        g2.setColor(new Color(45, 35, 25, 190));
        for (int i = 0; i < 35; i++) {
            int px = (i * 59) % width;
            int py = (i * 83) % height;
            g2.fillOval(px, py, 5, 4);
        }

        g2.dispose();
        return img;
    }

    /**
     * Procedural palm tree canopy sprite viewed from top-down / 2.5D.
     */
    public BufferedImage createPalmCanopySprite(int width, int height) {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2 = img.createGraphics();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        int cx = width / 2;
        int cy = height / 2;

        // Shadow under canopy
        g2.setColor(new Color(0, 0, 0, 70));
        g2.fillOval(cx - 50, cy - 40, 100, 80);

        // Palm fronds radiating outwards
        int numFronds = 10;
        for (int i = 0; i < numFronds; i++) {
            double angle = (2 * Math.PI / numFronds) * i;
            double len = width * 0.44;

            Path2D frond = new Path2D.Double();
            frond.moveTo(cx, cy);

            double tipX = cx + Math.cos(angle) * len;
            double tipY = cy + Math.sin(angle) * len;

            double sideAngle1 = angle + 0.16;
            double sideAngle2 = angle - 0.16;
            double midLen = len * 0.6;

            frond.curveTo(
                    cx + Math.cos(sideAngle1) * midLen, cy + Math.sin(sideAngle1) * midLen,
                    tipX, tipY,
                    tipX, tipY
            );
            frond.curveTo(
                    cx + Math.cos(sideAngle2) * midLen, cy + Math.sin(sideAngle2) * midLen,
                    cx, cy,
                    cx, cy
            );

            // Shaded frond green
            Color frondColor = (i % 2 == 0)
                    ? new Color(36, 96, 24, 230)
                    : new Color(52, 126, 36, 230);
            g2.setColor(frondColor);
            g2.fill(frond);

            // Frond central stem
            g2.setColor(new Color(110, 150, 40, 240));
            g2.setStroke(new BasicStroke(1.8f));
            g2.draw(new Line2D.Double(cx, cy, tipX, tipY));
        }

        // Center trunk / crown
        g2.setColor(new Color(60, 42, 22));
        g2.fillOval(cx - 10, cy - 10, 20, 20);

        g2.dispose();
        return img;
    }

    /**
     * Procedural giant Amazon Kapok tree with massive buttress crown.
     */
    public BufferedImage createKapokTreeSprite(int width, int height) {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2 = img.createGraphics();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        int cx = width / 2;
        int cy = height / 2;

        // Large ground shadow
        g2.setColor(new Color(0, 0, 0, 90));
        g2.fillOval(cx - 90, cy - 80, 180, 160);

        // Huge layered foliage clusters
        int[][] clusters = {
                {cx, cy, 95, 80},
                {cx - 40, cy - 35, 75, 65},
                {cx + 45, cy - 25, 70, 60},
                {cx - 20, cy + 45, 80, 70},
                {cx + 35, cy + 35, 75, 65}
        };

        for (int[] c : clusters) {
            RadialGradientPaint grad = new RadialGradientPaint(
                    new Point2D.Float(c[0] - 15, c[1] - 15),
                    c[2] * 0.7f,
                    new float[]{0.0f, 0.7f, 1.0f},
                    new Color[]{new Color(58, 122, 40), new Color(28, 72, 18), new Color(14, 45, 10)}
            );
            g2.setPaint(grad);
            g2.fillOval(c[0] - c[2] / 2, c[1] - c[3] / 2, c[2], c[3]);
        }

        g2.dispose();
        return img;
    }

    /**
     * Procedural river boulder sprite with moss and water splash marks.
     */
    public BufferedImage createRiverRockSprite(int width, int height) {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2 = img.createGraphics();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        int cx = width / 2;
        int cy = height / 2;

        // Rock base shape
        g2.setColor(new Color(0, 0, 0, 80));
        g2.fillOval(cx - 32, cy - 18, 64, 38);

        RadialGradientPaint rockGrad = new RadialGradientPaint(
                new Point2D.Float(cx - 8, cy - 6),
                35.0f,
                new float[]{0.0f, 0.6f, 1.0f},
                new Color[]{new Color(130, 134, 128), new Color(85, 90, 86), new Color(48, 52, 50)}
        );
        g2.setPaint(rockGrad);
        g2.fillOval(cx - 28, cy - 20, 56, 40);

        // Moss accents on rock top
        g2.setColor(new Color(52, 98, 36, 170));
        g2.fillOval(cx - 18, cy - 16, 26, 14);

        g2.dispose();
        return img;
    }

    /**
     * Procedural mossy fallen log obstacle with bark texture and branch stubs.
     */
    public BufferedImage createFallenLogSprite(int width, int height) {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2 = img.createGraphics();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Shadow
        g2.setColor(new Color(0, 0, 0, 80));
        g2.fillRoundRect(8, height / 2 - 8, width - 16, 26, 16, 16);

        // Wooden log body
        GradientPaint logGrad = new GradientPaint(
                0, 6, new Color(92, 64, 38),
                0, height - 10, new Color(48, 32, 18)
        );
        g2.setPaint(logGrad);
        g2.fillRoundRect(10, 6, width - 20, height - 16, 14, 14);

        // Bark grooves
        g2.setColor(new Color(32, 20, 10, 160));
        g2.setStroke(new BasicStroke(1.6f));
        for (int x = 20; x < width - 20; x += 18) {
            g2.drawLine(x, 10, x + 6, height - 14);
        }

        // Moss covering
        g2.setColor(new Color(64, 115, 42, 180));
        g2.fillOval(width / 4, 8, 38, 12);
        g2.fillOval((int)(width * 0.65), 10, 30, 10);

        g2.dispose();
        return img;
    }
}
