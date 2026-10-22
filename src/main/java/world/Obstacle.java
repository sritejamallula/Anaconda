package world;

import assets.AssetLoader;
import game.Camera;

import java.awt.*;
import java.awt.geom.Point2D;
import java.awt.image.BufferedImage;

/**
 * Natural rainforest obstacles: Kapok trees with buttress roots, palm trunks,
 * river boulders, and mossy fallen logs. Provides circular collision detection.
 */
public class Obstacle {
    public enum ObstacleType {
        KAPOK_TREE("kapok_tree", 42.0, 240, 240),
        PALM_TREE("palm_canopy", 24.0, 180, 180),
        RIVER_ROCK("river_rock", 22.0, 80, 60),
        FALLEN_LOG("fallen_log", 26.0, 160, 48);

        public final String assetKey;
        public final double collisionRadius;
        public final int renderWidth;
        public final int renderHeight;

        ObstacleType(String assetKey, double collisionRadius, int renderWidth, int renderHeight) {
            this.assetKey = assetKey;
            this.collisionRadius = collisionRadius;
            this.renderWidth = renderWidth;
            this.renderHeight = renderHeight;
        }
    }

    private final double x;
    private final double y;
    private final ObstacleType type;
    private final double rotation;

    public Obstacle(double x, double y, ObstacleType type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.rotation = Math.random() * Math.PI * 2;
    }

    public void render(Graphics2D g2, Camera camera) {
        Point2D.Double screen = camera.worldToScreen(x, y);
        double zoom = camera.getZoom();
        int w = (int) (type.renderWidth * zoom);
        int h = (int) (type.renderHeight * zoom);

        // View frustum culling check
        if (screen.x + w < 0 || screen.x - w > camera.getViewportWidth() ||
            screen.y + h < 0 || screen.y - h > camera.getViewportHeight()) {
            return;
        }

        BufferedImage img = AssetLoader.getInstance().getImage(type.assetKey);
        if (img != null) {
            Graphics2D g = (Graphics2D) g2.create();
            g.translate(screen.x, screen.y);
            g.rotate(rotation);
            g.drawImage(img, -w / 2, -h / 2, w, h, null);
            g.dispose();
        } else {
            // Procedural fallback
            g2.setColor(new Color(40, 60, 20, 180));
            double r = type.collisionRadius * zoom;
            g2.fillOval((int) (screen.x - r), (int) (screen.y - r), (int) (r * 2), (int) (r * 2));
        }
    }

    public boolean checkCollision(double targetX, double targetY, double targetRadius) {
        double dist = Math.hypot(targetX - x, targetY - y);
        return dist < (type.collisionRadius + targetRadius);
    }

    public double getX() { return x; }
    public double getY() { return y; }
    public ObstacleType getType() { return type; }
    public double getCollisionRadius() { return type.collisionRadius; }
}
