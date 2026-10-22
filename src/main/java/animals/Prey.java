package animals;

import game.Camera;
import world.World;

import java.awt.*;
import java.awt.geom.Point2D;

/**
 * Abstract base class for all Amazon prey animals.
 * Implements predatory flee AI, state transitions, habitat boundaries,
 * collision bounding, and life-cycle single consumption enforcement.
 */
public abstract class Prey {
    public enum PreyState {
        IDLE,
        FORAGING,
        ALERT,
        FLEEING,
        CAUGHT,
        DEAD
    }

    protected double x;
    protected double y;
    protected double heading;
    protected double speed;
    protected final PreyType type;
    protected PreyState state;
    protected double stateTimer;
    protected double animTime;
    protected boolean alive;
    protected boolean devoured;
    protected double collisionRadius;

    public Prey(double x, double y, PreyType type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.heading = Math.random() * Math.PI * 2;
        this.speed = type.baseSpeed * (0.8 + Math.random() * 0.4);
        this.state = PreyState.IDLE;
        this.stateTimer = 1.0 + Math.random() * 2.0;
        this.animTime = Math.random() * 10.0;
        this.alive = true;
        this.devoured = false;
        this.collisionRadius = 14.0 * type.sizeMultiplier;
    }

    public void update(double dt, double predatorX, double predatorY, World world) {
        if (!alive || devoured) return;

        animTime += dt;
        stateTimer -= dt;

        double distToPredator = Math.hypot(predatorX - x, predatorY - y);

        // AI Behavioral State Machine
        if (distToPredator < type.alertRadius) {
            state = (distToPredator < type.alertRadius * 0.6) ? PreyState.FLEEING : PreyState.ALERT;
            // Turn away from predator
            double fleeAngle = Math.atan2(y - predatorY, x - predatorX);
            double diff = fleeAngle - heading;
            while (diff < -Math.PI) diff += 2 * Math.PI;
            while (diff > Math.PI) diff -= 2 * Math.PI;
            heading += diff * 0.18;
        } else if (stateTimer <= 0.0) {
            // Switch randomly between IDLE and FORAGING
            if (state == PreyState.IDLE) {
                state = PreyState.FORAGING;
                stateTimer = 2.0 + Math.random() * 3.0;
                heading += (Math.random() - 0.5) * 1.5;
            } else {
                state = PreyState.IDLE;
                stateTimer = 1.5 + Math.random() * 2.5;
            }
        }

        // Locomotion
        double currentSpeed = 0.0;
        if (state == PreyState.FLEEING) {
            currentSpeed = speed * 1.45;
        } else if (state == PreyState.FORAGING) {
            currentSpeed = speed * 0.45;
        }

        double nextX = x + Math.cos(heading) * currentSpeed * dt;
        double nextY = y + Math.sin(heading) * currentSpeed * dt;

        // Habitat & Obstacle Boundary Enforcement
        boolean nextInWater = world.isInWater(nextX, nextY);
        boolean allowMove = true;

        if (type.habitat == PreyType.Habitat.WATER && !nextInWater) {
            allowMove = false; // Fish must stay in water
        } else if (type.habitat == PreyType.Habitat.FOREST_FLOOR && nextInWater) {
            allowMove = false; // Rodents avoid deep water
        }

        if (world.checkObstacleCollision(nextX, nextY, collisionRadius)) {
            allowMove = false;
        }

        if (allowMove) {
            x = nextX;
            y = nextY;
        } else {
            // Turn around when hitting a boundary
            heading += Math.PI * 0.75;
        }

        updateAnimation(dt);
    }

    public abstract void updateAnimation(double dt);

    public abstract void render(Graphics2D g, Camera camera);

    /**
     * Checks if the anaconda's head collides with this prey.
     */
    public boolean checkCollision(double predatorX, double predatorY, double predatorRadius) {
        if (!alive || devoured) return false;
        double dist = Math.hypot(predatorX - x, predatorY - y);
        return dist < (collisionRadius + predatorRadius);
    }

    /**
     * Devours the prey. Enforces single-consumption rule.
     */
    public synchronized boolean catchAndConsume() {
        if (!alive || devoured) return false;
        alive = false;
        devoured = true;
        state = PreyState.DEAD;
        return true;
    }

    public double getX() { return x; }
    public double getY() { return y; }
    public double getHeading() { return heading; }
    public PreyType getType() { return type; }
    public PreyState getState() { return state; }
    public boolean isAlive() { return alive; }
    public boolean isDevoured() { return devoured; }
    public double getCollisionRadius() { return collisionRadius; }
}
