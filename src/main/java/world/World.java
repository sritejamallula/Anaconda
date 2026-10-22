package world;

import game.Camera;

import java.awt.*;
import java.util.ArrayList;
import java.util.List;

/**
 * World container managing the rainforest island, surrounding river channels,
 * static obstacles (trees, rocks, logs), atmospheric visual effects, and exit portals.
 */
public class World {
    private Island island;
    private River river;
    private final List<Obstacle> obstacles = new ArrayList<>();
    private AtmosphericEffects atmosphericEffects;
    private RiverCrossingPortal exitPortal;
    private double worldSize;

    public World(double worldSize) {
        this.worldSize = worldSize;
        this.atmosphericEffects = new AtmosphericEffects(worldSize);
    }

    public void setupLevel(Island island, River river, List<Obstacle> obstacleList, RiverCrossingPortal portal) {
        this.island = island;
        this.river = river;
        this.obstacles.clear();
        if (obstacleList != null) {
            this.obstacles.addAll(obstacleList);
        }
        this.exitPortal = portal;
        this.atmosphericEffects = new AtmosphericEffects(worldSize);
    }

    public void update(double dt) {
        if (river != null) river.update(dt);
        if (atmosphericEffects != null) atmosphericEffects.update(dt);
        if (exitPortal != null) exitPortal.update(dt);
    }

    public boolean isInWater(double x, double y) {
        if (river != null && river.isInWater(x, y)) {
            return true;
        }
        // If outside island boundaries, it's open river
        if (island != null && !island.contains(x, y)) {
            return true;
        }
        return false;
    }

    public boolean checkObstacleCollision(double x, double y, double radius) {
        for (Obstacle obs : obstacles) {
            if (obs.checkCollision(x, y, radius)) {
                return true;
            }
        }
        return false;
    }

    public void renderBackground(Graphics2D g2, Camera camera) {
        // 1. Surrounding Deep River base
        if (river != null) {
            river.render(g2, camera, worldSize);
        }

        // 2. Island Landmass
        if (island != null) {
            island.render(g2, camera);
        }

        // 3. Water Ripples & Lower Atmospheric effects
        if (atmosphericEffects != null) {
            atmosphericEffects.renderUnderEntities(g2, camera);
        }

        // 4. River Crossing Portal
        if (exitPortal != null) {
            exitPortal.render(g2, camera);
        }

        // 5. Obstacles (rocks, logs, lower tree trunks)
        for (Obstacle obs : obstacles) {
            obs.render(g2, camera);
        }
    }

    public void renderForeground(Graphics2D g2, Camera camera) {
        // Canopy God-Rays, Mist, Spores, and Butterflies
        if (atmosphericEffects != null) {
            atmosphericEffects.renderOverEntities(g2, camera);
        }
    }

    public Island getIsland() { return island; }
    public River getRiver() { return river; }
    public List<Obstacle> getObstacles() { return obstacles; }
    public AtmosphericEffects getAtmosphericEffects() { return atmosphericEffects; }
    public RiverCrossingPortal getExitPortal() { return exitPortal; }
    public double getWorldSize() { return worldSize; }
}
