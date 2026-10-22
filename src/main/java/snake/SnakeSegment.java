package snake;

/**
 * Represents an individual anatomical cross-section/segment of the anaconda's body.
 * Each segment has a dynamic radius influenced by natural tapering and digestion bulges.
 */
public class SnakeSegment {
    private double x;
    private double y;
    private double angle;
    private double baseRadius;
    private double currentRadius;
    private double distanceFromHead;
    private boolean submerged;

    public SnakeSegment(double x, double y, double angle, double baseRadius, double distanceFromHead) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.baseRadius = baseRadius;
        this.currentRadius = baseRadius;
        this.distanceFromHead = distanceFromHead;
        this.submerged = false;
    }

    public void updatePosition(double x, double y, double angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
    }

    public double getX() { return x; }
    public double getY() { return y; }
    public double getAngle() { return angle; }
    public double getBaseRadius() { return baseRadius; }
    public void setBaseRadius(double baseRadius) { this.baseRadius = baseRadius; }
    public double getCurrentRadius() { return currentRadius; }
    public void setCurrentRadius(double currentRadius) { this.currentRadius = currentRadius; }
    public double getDistanceFromHead() { return distanceFromHead; }
    public void setDistanceFromHead(double dist) { this.distanceFromHead = dist; }
    public boolean isSubmerged() { return submerged; }
    public void setSubmerged(boolean submerged) { this.submerged = submerged; }
}
