package game;

import java.awt.geom.Point2D;

/**
 * 2.5D tracking camera that smoothly follows the anaconda's head with leading offset
 * in the direction of motion, zoom adjustments, and world-to-screen transformations.
 */
public class Camera {
    private double x;
    private double y;
    private double targetX;
    private double targetY;
    private int viewportWidth;
    private int viewportHeight;
    private double zoom = 1.0;
    private double targetZoom = 1.0;
    private double smoothSpeed = 0.12;

    public Camera(int viewportWidth, int viewportHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
    }

    public void update(double focusX, double focusY, double heading, double speed, double dt) {
        // Lead-ahead in heading direction so player can see ahead
        double leadDistance = Math.min(140.0, speed * 0.45);
        this.targetX = focusX + Math.cos(heading) * leadDistance;
        this.targetY = focusY + Math.sin(heading) * leadDistance;

        // Smooth lerp towards target
        double factor = 1.0 - Math.pow(1.0 - smoothSpeed, dt * 60.0);
        this.x += (targetX - x) * factor;
        this.y += (targetY - y) * factor;

        // Smooth zoom interpolation
        this.zoom += (targetZoom - zoom) * factor * 0.5;
    }

    public void setImmediatePosition(double targetX, double targetY) {
        this.x = targetX;
        this.y = targetY;
        this.targetX = targetX;
        this.targetY = targetY;
    }

    public void setViewportSize(int width, int height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }

    public void setTargetZoom(double targetZoom) {
        this.targetZoom = Math.max(0.6, Math.min(1.8, targetZoom));
    }

    public Point2D.Double worldToScreen(double worldX, double worldY) {
        double screenX = (worldX - x) * zoom + (viewportWidth * 0.5);
        double screenY = (worldY - y) * zoom + (viewportHeight * 0.5);
        return new Point2D.Double(screenX, screenY);
    }

    public Point2D.Double screenToWorld(double screenX, double screenY) {
        double worldX = (screenX - (viewportWidth * 0.5)) / zoom + x;
        double worldY = (screenY - (viewportHeight * 0.5)) / zoom + y;
        return new Point2D.Double(worldX, worldY);
    }

    public double getX() { return x; }
    public double getY() { return y; }
    public double getZoom() { return zoom; }
    public int getViewportWidth() { return viewportWidth; }
    public int getViewportHeight() { return viewportHeight; }
}
