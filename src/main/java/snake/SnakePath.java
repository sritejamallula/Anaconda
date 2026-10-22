package snake;

import java.util.ArrayList;
import java.util.List;

/**
 * High-precision arc-length trail recording and interpolation engine.
 * Solves the continuous path-following problem for the anaconda, ensuring
 * that segments follow the head along an organic, continuous curve without
 * unnatural sharp angles, gaps, or bunching.
 */
public class SnakePath {
    public static class PathPoint {
        public final double x;
        public final double y;
        public final double angle;
        public final double distFromHead; // Cumulative arc length from current head

        public PathPoint(double x, double y, double angle, double distFromHead) {
            this.x = x;
            this.y = y;
            this.angle = angle;
            this.distFromHead = distFromHead;
        }
    }

    public static class SampleResult {
        public final double x;
        public final double y;
        public final double angle;

        public SampleResult(double x, double y, double angle) {
            this.x = x;
            this.y = y;
            this.angle = angle;
        }
    }

    private final List<PathPoint> points = new ArrayList<>();
    private static final double MIN_RECORD_DISTANCE = 2.0; // Minimum delta to record new point
    private double totalDistance = 0.0;

    public SnakePath(double initialX, double initialY, double initialAngle, double initialLength) {
        reset(initialX, initialY, initialAngle, initialLength);
    }

    public synchronized void reset(double initialX, double initialY, double initialAngle, double initialLength) {
        points.clear();
        totalDistance = 0.0;
        int numInitialPoints = (int) Math.max(10, initialLength / MIN_RECORD_DISTANCE) + 10;
        double dx = Math.cos(initialAngle + Math.PI);
        double dy = Math.sin(initialAngle + Math.PI);

        for (int i = 0; i < numInitialPoints; i++) {
            double dist = i * MIN_RECORD_DISTANCE;
            double px = initialX + dx * dist;
            double py = initialY + dy * dist;
            points.add(new PathPoint(px, py, initialAngle, dist));
        }
        totalDistance = (numInitialPoints - 1) * MIN_RECORD_DISTANCE;
    }

    /**
     * Records a new head position. If the head moved by at least MIN_RECORD_DISTANCE,
     * updates the historical trail.
     */
    public synchronized void recordHead(double headX, double headY, double headAngle) {
        if (points.isEmpty()) {
            points.add(new PathPoint(headX, headY, headAngle, 0.0));
            return;
        }

        PathPoint lastHead = points.get(0);
        double dist = Math.hypot(headX - lastHead.x, headY - lastHead.y);

        if (dist >= MIN_RECORD_DISTANCE) {
            // Re-offset all existing points by dist
            List<PathPoint> updated = new ArrayList<>(points.size() + 1);
            updated.add(new PathPoint(headX, headY, headAngle, 0.0));

            for (PathPoint p : points) {
                updated.add(new PathPoint(p.x, p.y, p.angle, p.distFromHead + dist));
            }

            points.clear();
            points.addAll(updated);
            totalDistance += dist;
        }
    }

    /**
     * Prunes trail points that are further than maxRequiredDistance.
     */
    public synchronized void prune(double maxRequiredDistance) {
        double threshold = maxRequiredDistance + 80.0;
        while (points.size() > 4 && points.get(points.size() - 1).distFromHead > threshold) {
            points.remove(points.size() - 1);
        }
    }

    /**
     * Samples the historical path at an exact distance behind the head.
     * Uses linear and angular lerp between the two closest recorded points.
     */
    public synchronized SampleResult sampleAtDistance(double targetDist) {
        if (points.isEmpty()) {
            return new SampleResult(0, 0, 0);
        }
        if (targetDist <= 0 || points.size() == 1) {
            PathPoint p = points.get(0);
            return new SampleResult(p.x, p.y, p.angle);
        }

        // Search for segment containing targetDist
        for (int i = 0; i < points.size() - 1; i++) {
            PathPoint p0 = points.get(i);
            PathPoint p1 = points.get(i + 1);

            if (p0.distFromHead <= targetDist && p1.distFromHead >= targetDist) {
                double segmentLen = p1.distFromHead - p0.distFromHead;
                double t = (segmentLen > 0.0001) ? (targetDist - p0.distFromHead) / segmentLen : 0.0;
                t = Math.max(0.0, Math.min(1.0, t));

                double interX = p0.x + (p1.x - p0.x) * t;
                double interY = p0.y + (p1.y - p0.y) * t;
                double interAngle = lerpAngle(p0.angle, p1.angle, t);

                return new SampleResult(interX, interY, interAngle);
            }
        }

        // If beyond last point, extrapolate along the last direction
        PathPoint last = points.get(points.size() - 1);
        double extraDist = targetDist - last.distFromHead;
        double extX = last.x + Math.cos(last.angle + Math.PI) * extraDist;
        double extY = last.y + Math.sin(last.angle + Math.PI) * extraDist;
        return new SampleResult(extX, extY, last.angle);
    }

    /**
     * Smoothly interpolates angles taking the shortest circular route across (-PI, PI).
     */
    private double lerpAngle(double a0, double a1, double t) {
        double diff = a1 - a0;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        return a0 + diff * t;
    }

    public synchronized List<PathPoint> getPointsSnapshot() {
        return new ArrayList<>(points);
    }
}
