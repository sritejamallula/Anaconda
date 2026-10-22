package ui;

import animals.Prey;
import game.Camera;
import game.GameConfig;

import java.awt.*;
import java.awt.geom.Point2D;
import java.awt.geom.RoundRectangle2D;
import java.util.List;

/**
 * Thermal Pit Vision Mode (Jacobson's Organ infrared simulation).
 * Shifts the rainforest to deep predatory blues/cyans while illuminating
 * warm-blooded and active prey in incandescent fiery infrared glows.
 */
public class ThermalVisionRenderer {

    public void render(Graphics2D g2, Camera camera, List<Prey> preyList, int screenW, int screenH) {
        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // 1. Cool Indigo/Cyan Infrared Atmospheric Tint
        g.setColor(new Color(6, 14, 45, 140));
        g.fillRect(0, 0, screenW, screenH);

        // 2. Scanline Texture Overlay
        g.setColor(new Color(20, 60, 110, 35));
        for (int y = 0; y < screenH; y += 4) {
            g.fillRect(0, y, screenW, 1);
        }

        // 3. Radiant Thermal Signatures for Living Prey
        double zoom = camera.getZoom();
        for (Prey p : preyList) {
            if (!p.isAlive()) continue;

            Point2D.Double screen = camera.worldToScreen(p.getX(), p.getY());
            if (screen.x < -60 || screen.x > screenW + 60 || screen.y < -60 || screen.y > screenH + 60) {
                continue;
            }

            double r = p.getCollisionRadius() * zoom;

            // Outer Heat Halo (Radiant Red/Orange)
            RadialGradientPaint heatAura = new RadialGradientPaint(
                    new Point2D.Float((float) screen.x, (float) screen.y),
                    (float) (r * 2.8),
                    new float[]{0.0f, 0.45f, 1.0f},
                    new Color[]{
                            GameConfig.THERMAL_PREY_CORE,
                            GameConfig.THERMAL_PREY_OUTER,
                            new Color(180, 20, 10, 0)
                    }
            );
            g.setPaint(heatAura);
            g.fillOval((int) (screen.x - r * 2.8), (int) (screen.y - r * 2.8), (int) (r * 5.6), (int) (r * 5.6));

            // Temperature Tag
            g.setFont(new Font("Monospaced", Font.BOLD, 10));
            g.setColor(new Color(255, 240, 120));
            double tempC = 36.5 + (p.getType().sizeMultiplier * 1.5);
            g.drawString(String.format("%.1f°C", tempC), (int) screen.x - 18, (int) (screen.y - r * 1.6));
        }

        // 4. Infrared HUD Banner
        int bannerW = 280;
        int bannerH = 26;
        int bannerX = (screenW - bannerW) / 2;
        int bannerY = 96;

        g.setColor(new Color(180, 40, 20, 190));
        g.fill(new RoundRectangle2D.Double(bannerX, bannerY, bannerW, bannerH, 12, 12));
        g.setColor(Color.WHITE);
        g.draw(new RoundRectangle2D.Double(bannerX, bannerY, bannerW, bannerH, 12, 12));

        g.setFont(new Font("SansSerif", Font.BOLD, 12));
        g.drawString("THERMAL PIT SENSORY ACTIVE [T]", bannerX + 22, bannerY + 18);

        g.dispose();
    }
}
