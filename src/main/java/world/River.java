package world;

import game.Camera;
import game.GameConfig;

import java.awt.*;
import java.awt.geom.Path2D;
import java.awt.geom.Point2D;

/**
 * Amazon river system simulation with dynamic currents, animated sine ripples,
 * water depth gradients, and aquatic surface caustics.
 */
public class River {
    private final double channelCenterX;
    private final double channelWidth;
    private final boolean isHorizontal;
    private double waveTime;

    public River(double channelCenter, double channelWidth, boolean isHorizontal) {
        this.channelCenterX = channelCenter;
        this.channelWidth = channelWidth;
        this.isHorizontal = isHorizontal;
        this.waveTime = 0.0;
    }

    public void update(double dt) {
        waveTime += dt * 1.6;
    }

    public boolean isInWater(double x, double y) {
        double distFromCenter = isHorizontal
                ? Math.abs(y - channelCenterX)
                : Math.abs(x - channelCenterX);
        return distFromCenter < (channelWidth * 0.5);
    }

    public void render(Graphics2D g2, Camera camera, double worldSize) {
        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        double halfW = channelWidth * 0.5;
        double minX = isHorizontal ? -worldSize * 0.5 : channelCenterX - halfW;
        double maxX = isHorizontal ? worldSize * 0.5 : channelCenterX + halfW;
        double minY = isHorizontal ? channelCenterX - halfW : -worldSize * 0.5;
        double maxY = isHorizontal ? channelCenterX + halfW : worldSize * 0.5;

        Point2D.Double p1 = camera.worldToScreen(minX, minY);
        Point2D.Double p2 = camera.worldToScreen(maxX, maxY);

        double screenW = Math.abs(p2.x - p1.x);
        double screenH = Math.abs(p2.y - p1.y);
        double screenX = Math.min(p1.x, p2.x);
        double screenY = Math.min(p1.y, p2.y);

        // 1. Deep River Base Fill
        GradientPaint waterGrad = new GradientPaint(
                (float) screenX, (float) screenY, GameConfig.COLOR_RIVER_SHALLOW,
                (float) (screenX + screenW * 0.5), (float) (screenY + screenH * 0.5), GameConfig.COLOR_RIVER_DEEP
        );
        g.setPaint(waterGrad);
        g.fillRect((int) screenX, (int) screenY, (int) screenW, (int) screenH);

        // 2. Animated Flowing Wave Ripples
        g.setColor(GameConfig.COLOR_RIVER_HIGHLIGHT);
        g.setStroke(new BasicStroke(2.0f * (float) camera.getZoom()));

        int step = (int) (40 * camera.getZoom());
        if (step < 10) step = 10;

        if (isHorizontal) {
            for (double wy = minY + 15; wy < maxY - 15; wy += 35) {
                Path2D path = new Path2D.Double();
                boolean first = true;
                for (double wx = minX; wx <= maxX; wx += 50) {
                    double waveOffset = Math.sin((wx * 0.02) + waveTime + (wy * 0.03)) * 8.0;
                    Point2D.Double sp = camera.worldToScreen(wx, wy + waveOffset);
                    if (first) {
                        path.moveTo(sp.x, sp.y);
                        first = false;
                    } else {
                        path.lineTo(sp.x, sp.y);
                    }
                }
                g.draw(path);
            }
        } else {
            for (double wx = minX + 15; wx < maxX - 15; wx += 35) {
                Path2D path = new Path2D.Double();
                boolean first = true;
                for (double wy = minY; wy <= maxY; wy += 50) {
                    double waveOffset = Math.sin((wy * 0.02) + waveTime + (wx * 0.03)) * 8.0;
                    Point2D.Double sp = camera.worldToScreen(wx + waveOffset, wy);
                    if (first) {
                        path.moveTo(sp.x, sp.y);
                        first = false;
                    } else {
                        path.lineTo(sp.x, sp.y);
                    }
                }
                g.draw(path);
            }
        }

        g.dispose();
    }

    public double getChannelCenterX() { return channelCenterX; }
    public double getChannelWidth() { return channelWidth; }
}
