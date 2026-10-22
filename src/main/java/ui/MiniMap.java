package ui;

import animals.Prey;
import game.GameConfig;
import snake.Anaconda;
import snake.SnakeSegment;
import world.Island;
import world.RiverCrossingPortal;
import world.World;

import java.awt.*;
import java.awt.geom.Ellipse2D;
import java.awt.geom.Line2D;
import java.util.List;

/**
 * Tactical circular bio-radar minimap.
 * Displays island topography, anaconda body trail, color-coded prey blips,
 * dynamic river crossing portal, and rotating sensor sweep line.
 */
public class MiniMap {
    private final int centerX;
    private final int centerY;
    private final int radius;
    private double radarSweepAngle;

    public MiniMap(int centerX, int centerY, int radius) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.radius = radius;
        this.radarSweepAngle = 0.0;
    }

    public void update(double dt) {
        radarSweepAngle += dt * 2.8; // Rotating sensor sweep
    }

    public void render(Graphics2D g2, Anaconda anaconda, World world, List<Prey> preyList) {
        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        double worldSize = world.getWorldSize();
        double scale = (radius * 0.90) / (worldSize * 0.5);

        // Clip to circular radar boundary
        Shape oldClip = g.getClip();
        g.setClip(new Ellipse2D.Double(centerX - radius, centerY - radius, radius * 2, radius * 2));

        // 1. Radar Background (Dark Amazonian Bio-Glass)
        g.setColor(new Color(6, 18, 14, 230));
        g.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

        // 2. Island Contour
        Island island = world.getIsland();
        if (island != null) {
            int iw = (int) (island.getWidth() * scale);
            int ih = (int) (island.getHeight() * scale);
            int ix = centerX + (int) (island.getCenterX() * scale) - iw / 2;
            int iy = centerY + (int) (island.getCenterY() * scale) - ih / 2;
            g.setColor(new Color(25, 52, 28, 180));
            g.fillRoundRect(ix, iy, iw, ih, 14, 14);
            g.setColor(new Color(65, 125, 55, 200));
            g.setStroke(new BasicStroke(1.2f));
            g.drawRoundRect(ix, iy, iw, ih, 14, 14);
        }

        // 3. Living Prey Blips
        for (Prey p : preyList) {
            if (!p.isAlive()) continue;
            int px = centerX + (int) (p.getX() * scale);
            int py = centerY + (int) (p.getY() * scale);

            g.setColor(p.getType().radarColor);
            int blipSize = (p.getType().sizeMultiplier > 1.5) ? 6 : 4;
            g.fillOval(px - blipSize / 2, py - blipSize / 2, blipSize, blipSize);
        }

        // 4. Anaconda Body Trail & Head
        List<SnakeSegment> segments = anaconda.getSegments();
        g.setColor(new Color(80, 200, 60, 160));
        for (int i = segments.size() - 1; i >= 0; i -= 2) {
            SnakeSegment seg = segments.get(i);
            int sx = centerX + (int) (seg.getX() * scale);
            int sy = centerY + (int) (seg.getY() * scale);
            g.fillOval(sx - 1, sy - 1, 3, 3);
        }

        // Anaconda Head Blip
        int hx = centerX + (int) (anaconda.getX() * scale);
        int hy = centerY + (int) (anaconda.getY() * scale);
        g.setColor(new Color(110, 255, 80));
        g.fillOval(hx - 3, hy - 3, 7, 7);

        // Heading indicator line
        double hAngle = anaconda.getHeading();
        g.setStroke(new BasicStroke(1.4f));
        g.draw(new Line2D.Double(hx, hy, hx + Math.cos(hAngle) * 9, hy + Math.sin(hAngle) * 9));

        // 5. River Crossing Portal (Flashing Beacon)
        RiverCrossingPortal portal = world.getExitPortal();
        if (portal != null) {
            int pox = centerX + (int) (portal.getX() * scale);
            int poy = centerY + (int) (portal.getY() * scale);
            if (portal.isUnlocked()) {
                g.setColor(new Color(0, 255, 220));
                g.fillRect(pox - 4, poy - 4, 8, 8);
                g.setColor(Color.WHITE);
                g.drawRect(pox - 4, poy - 4, 8, 8);
            } else {
                g.setColor(new Color(160, 60, 40));
                g.drawRect(pox - 3, poy - 3, 6, 6);
            }
        }

        // 6. Rotating Sensor Sweep Line
        double sweepX = centerX + Math.cos(radarSweepAngle) * radius;
        double sweepY = centerY + Math.sin(radarSweepAngle) * radius;
        g.setColor(new Color(80, 220, 120, 110));
        g.setStroke(new BasicStroke(1.4f));
        g.draw(new Line2D.Double(centerX, centerY, sweepX, sweepY));

        // Restore clip
        g.setClip(oldClip);

        // 7. Radar Outer Bezel & Range Rings
        g.setColor(new Color(40, 80, 50, 140));
        g.setStroke(new BasicStroke(1.0f));
        g.draw(new Ellipse2D.Double(centerX - radius * 0.5, centerY - radius * 0.5, radius, radius));

        // Metallic outer bezel ring
        g.setColor(new Color(75, 140, 65, 220));
        g.setStroke(new BasicStroke(2.6f));
        g.draw(new Ellipse2D.Double(centerX - radius, centerY - radius, radius * 2, radius * 2));

        // Label
        g.setFont(GameConfig.FONT_RADAR);
        g.setColor(new Color(140, 220, 120));
        g.drawString("BIO-RADAR", centerX - 32, centerY + radius + 15);

        g.dispose();
    }
}
