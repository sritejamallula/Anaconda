package world;

import assets.AssetLoader;
import game.Camera;
import game.GameConfig;

import java.awt.*;
import java.awt.geom.Point2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;

/**
 * Represents an Amazon rainforest island with lush interior terrain,
 * muddy riverbank borders, and spatial containment bounds.
 */
public class Island {
    private final double centerX;
    private final double centerY;
    private final double width;
    private final double height;
    private final double cornerRadius;
    private final String name;

    public Island(String name, double centerX, double centerY, double width, double height, double cornerRadius) {
        this.name = name;
        this.centerX = centerX;
        this.centerY = centerY;
        this.width = width;
        this.height = height;
        this.cornerRadius = cornerRadius;
    }

    public boolean contains(double px, double py) {
        double minX = centerX - width * 0.5;
        double maxX = centerX + width * 0.5;
        double minY = centerY - height * 0.5;
        double maxY = centerY + height * 0.5;
        return (px >= minX && px <= maxX && py >= minY && py <= maxY);
    }

    public void render(Graphics2D g2, Camera camera) {
        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        double halfW = width * 0.5;
        double halfH = height * 0.5;
        Point2D.Double p1 = camera.worldToScreen(centerX - halfW, centerY - halfH);
        Point2D.Double p2 = camera.worldToScreen(centerX + halfW, centerY + halfH);

        double screenW = Math.abs(p2.x - p1.x);
        double screenH = Math.abs(p2.y - p1.y);
        double screenX = Math.min(p1.x, p2.x);
        double screenY = Math.min(p1.y, p2.y);
        double arc = cornerRadius * camera.getZoom();

        // 1. Muddy Riverbank Border (Wet Mud Shore)
        g.setColor(GameConfig.COLOR_MUD_SHORE);
        g.fill(new RoundRectangle2D.Double(screenX - 16 * camera.getZoom(),
                screenY - 16 * camera.getZoom(),
                screenW + 32 * camera.getZoom(),
                screenH + 32 * camera.getZoom(),
                arc + 20, arc + 20));

        // 2. Interior Rainforest Soil & Vegetated Ground
        RoundRectangle2D islandShape = new RoundRectangle2D.Double(screenX, screenY, screenW, screenH, arc, arc);

        // Tile ground texture if available
        BufferedImage groundTile = AssetLoader.getInstance().getImage("jungle_ground");
        if (groundTile != null) {
            TexturePaint tp = new TexturePaint(groundTile, new Rectangle(
                    (int) (screenX % (256 * camera.getZoom())),
                    (int) (screenY % (256 * camera.getZoom())),
                    (int) (256 * camera.getZoom()),
                    (int) (256 * camera.getZoom())
            ));
            g.setPaint(tp);
        } else {
            g.setColor(GameConfig.COLOR_JUNGLE_SOIL);
        }
        g.fill(islandShape);

        // Soft shoreline shadow/mud blend
        g.setColor(new Color(25, 38, 15, 120));
        g.setStroke(new BasicStroke((float) (6.0 * camera.getZoom())));
        g.draw(islandShape);

        g.dispose();
    }

    public double getCenterX() { return centerX; }
    public double getCenterY() { return centerY; }
    public double getWidth() { return width; }
    public double getHeight() { return height; }
    public String getName() { return name; }
}
