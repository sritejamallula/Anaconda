package world;

import game.Camera;
import game.GameConfig;

import java.awt.*;
import java.awt.geom.Ellipse2D;
import java.awt.geom.Path2D;
import java.awt.geom.Point2D;

/**
 * River Crossing Portal: The exit gateway situated at the water's edge.
 * Unlocks once all required prey for the level have been devoured, guiding the
 * player across the river to the next island outpost via an interactive swimming sequence.
 */
public class RiverCrossingPortal {
    private final double x;
    private final double y;
    private final double triggerRadius;
    private boolean unlocked;
    private double animTime;

    public RiverCrossingPortal(double x, double y) {
        this.x = x;
        this.y = y;
        this.triggerRadius = 55.0;
        this.unlocked = false;
        this.animTime = 0.0;
    }

    public void update(double dt) {
        animTime += dt * 3.0;
    }

    public void setUnlocked(boolean unlocked) {
        this.unlocked = unlocked;
    }

    public boolean isUnlocked() {
        return unlocked;
    }

    public boolean isTriggered(double snakeX, double snakeY, double snakeRadius) {
        if (!unlocked) return false;
        double dist = Math.hypot(snakeX - x, snakeY - y);
        return dist < (triggerRadius + snakeRadius);
    }

    public void render(Graphics2D g2, Camera camera) {
        Point2D.Double screen = camera.worldToScreen(x, y);
        double zoom = camera.getZoom();
        double r = triggerRadius * zoom;

        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        if (unlocked) {
            // Luminous pulsing aquatic portal
            double pulse = 0.5 + 0.5 * Math.sin(animTime);
            double outerR = r * (1.0 + pulse * 0.25);

            // Radiant cyan glow rings
            g.setColor(new Color(64, 224, 208, (int) (60 + pulse * 60)));
            g.fill(new Ellipse2D.Double(screen.x - outerR, screen.y - outerR * 0.7, outerR * 2, outerR * 1.4));

            g.setColor(new Color(0, 255, 200, 210));
            g.setStroke(new BasicStroke((float) (3.5 * zoom)));
            g.draw(new Ellipse2D.Double(screen.x - r, screen.y - r * 0.7, r * 2, r * 1.4));

            // Animated beacon arrow pointing into the river
            double arrowBob = Math.sin(animTime * 1.5) * 8.0 * zoom;
            Path2D arrow = new Path2D.Double();
            arrow.moveTo(screen.x - 14 * zoom, screen.y - 12 * zoom + arrowBob);
            arrow.lineTo(screen.x, screen.y + 12 * zoom + arrowBob);
            arrow.lineTo(screen.x + 14 * zoom, screen.y - 12 * zoom + arrowBob);
            arrow.lineTo(screen.x + 5 * zoom, screen.y - 12 * zoom + arrowBob);
            arrow.lineTo(screen.x + 5 * zoom, screen.y - 24 * zoom + arrowBob);
            arrow.lineTo(screen.x - 5 * zoom, screen.y - 24 * zoom + arrowBob);
            arrow.lineTo(screen.x - 5 * zoom, screen.y - 12 * zoom + arrowBob);
            arrow.closePath();

            g.setColor(new Color(255, 255, 255, 240));
            g.fill(arrow);
            g.setColor(new Color(0, 180, 150));
            g.draw(arrow);

            // Floating banner text
            g.setFont(GameConfig.FONT_HUD_SMALL);
            g.setColor(Color.WHITE);
            String label = "RIVER CROSSING OPEN";
            FontMetrics fm = g.getFontMetrics();
            int strW = fm.stringWidth(label);
            g.drawString(label, (int) (screen.x - strW / 2), (int) (screen.y - r * 0.9));
        } else {
            // Inactive / Locked Mooring Post
            g.setColor(new Color(80, 50, 25, 180));
            g.fillOval((int) (screen.x - 12 * zoom), (int) (screen.y - 12 * zoom), (int) (24 * zoom), (int) (24 * zoom));
            g.setColor(new Color(40, 25, 12));
            g.drawOval((int) (screen.x - 12 * zoom), (int) (screen.y - 12 * zoom), (int) (24 * zoom), (int) (24 * zoom));

            // Locked ring indicator
            g.setColor(new Color(180, 60, 40, 150));
            g.setStroke(new BasicStroke((float) (1.8 * zoom)));
            g.draw(new Ellipse2D.Double(screen.x - r * 0.7, screen.y - r * 0.5, r * 1.4, r * 1.0));
        }

        g.dispose();
    }

    public double getX() { return x; }
    public double getY() { return y; }
}
