package levels;

import animals.Prey;
import world.Island;
import world.Obstacle;
import world.River;
import world.RiverCrossingPortal;

import java.util.List;

/**
 * Data encapsulation container for an Amazon rainforest level configuration.
 */
public class LevelData {
    public final int levelNumber;
    public final String name;
    public final String subtitle;
    public final String description;
    public final int requiredPreyQuota;
    public final double worldSize;
    public final double startX;
    public final double startY;
    public final double startAngle;

    public final Island island;
    public final River river;
    public final List<Obstacle> obstacles;
    public final List<Prey> initialFauna;
    public final RiverCrossingPortal portal;

    public LevelData(int levelNumber, String name, String subtitle, String description,
                     int requiredPreyQuota, double worldSize, double startX, double startY, double startAngle,
                     Island island, River river, List<Obstacle> obstacles, List<Prey> initialFauna, RiverCrossingPortal portal) {
        this.levelNumber = levelNumber;
        this.name = name;
        this.subtitle = subtitle;
        this.description = description;
        this.requiredPreyQuota = requiredPreyQuota;
        this.worldSize = worldSize;
        this.startX = startX;
        this.startY = startY;
        this.startAngle = startAngle;
        this.island = island;
        this.river = river;
        this.obstacles = obstacles;
        this.initialFauna = initialFauna;
        this.portal = portal;
    }
}
