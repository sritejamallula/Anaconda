package levels;

import animals.*;
import world.Island;
import world.Obstacle;
import world.River;
import world.RiverCrossingPortal;

import java.util.ArrayList;
import java.util.List;

/**
 * Manages the 5-stage Amazon rainforest level progression system,
 * island geometry, prey distributions, and river crossing event triggers.
 */
public class LevelManager {
    private int currentLevelIndex;
    private int highestUnlockedLevel;
    private LevelData currentLevelData;

    public LevelManager() {
        this.currentLevelIndex = 1;
        this.highestUnlockedLevel = 1;
        loadLevel(1);
    }

    public void loadLevel(int levelNumber) {
        this.currentLevelIndex = Math.max(1, Math.min(5, levelNumber));
        this.currentLevelData = buildLevel(this.currentLevelIndex);
    }

    public LevelData getCurrentLevelData() {
        return currentLevelData;
    }

    public int getCurrentLevelIndex() {
        return currentLevelIndex;
    }

    public int getHighestUnlockedLevel() {
        return highestUnlockedLevel;
    }

    public void setHighestUnlockedLevel(int level) {
        this.highestUnlockedLevel = Math.max(this.highestUnlockedLevel, level);
    }

    public boolean isObjectiveCompleted(int preyEatenInLevel) {
        return preyEatenInLevel >= currentLevelData.requiredPreyQuota;
    }

    public boolean advanceToNextLevel() {
        if (currentLevelIndex < 5) {
            currentLevelIndex++;
            if (currentLevelIndex > highestUnlockedLevel) {
                highestUnlockedLevel = currentLevelIndex;
            }
            loadLevel(currentLevelIndex);
            return true;
        }
        return false;
    }

    // ==========================================
    // 5 AMAZON LEVEL BUILDERS
    // ==========================================

    private LevelData buildLevel(int level) {
        switch (level) {
            case 1:
                return buildLevel1();
            case 2:
                return buildLevel2();
            case 3:
                return buildLevel3();
            case 4:
                return buildLevel4();
            case 5:
            default:
                return buildLevel5();
        }
    }

    /**
     * Level 1 — Small River Island: Nursery Shallows.
     * Teaches basic movement and hunting on a tranquil river island.
     */
    private LevelData buildLevel1() {
        double worldSize = 1200;
        Island island = new Island("Nursery Island", 0, 0, 680, 520, 90);
        River river = new River(0, 1100, false); // Vertical river channel surrounding island

        List<Obstacle> obs = new ArrayList<>();
        // Palm trees and kapok trees on island
        obs.add(new Obstacle(-180, -120, Obstacle.ObstacleType.PALM_TREE));
        obs.add(new Obstacle(190, -100, Obstacle.ObstacleType.PALM_TREE));
        obs.add(new Obstacle(-140, 140, Obstacle.ObstacleType.PALM_TREE));
        obs.add(new Obstacle(160, 130, Obstacle.ObstacleType.PALM_TREE));
        obs.add(new Obstacle(0, -160, Obstacle.ObstacleType.FALLEN_LOG));
        obs.add(new Obstacle(-60, 180, Obstacle.ObstacleType.RIVER_ROCK));

        List<Prey> fauna = new ArrayList<>();
        // Water fish in surrounding river
        fauna.add(new FishPrey(-390, -100));
        fauna.add(new FishPrey(-410, 80));
        fauna.add(new FishPrey(390, -60));
        fauna.add(new FishPrey(420, 120));
        // Frogs on island damp shorelines
        fauna.add(new FrogPrey(-240, -180));
        fauna.add(new FrogPrey(220, -160));
        fauna.add(new FrogPrey(-220, 170));
        fauna.add(new FrogPrey(200, 180));

        // River crossing portal on the eastern riverbank
        RiverCrossingPortal portal = new RiverCrossingPortal(330, 0);

        return new LevelData(
                1, "Level 1: Small River Island", "Nursery Shallows",
                "Learn to stalk and hunt aquatic catfish and shoreline tree frogs. Devour 3 prey to open the river crossing.",
                3, worldSize, 0, 0, 0.0,
                island, river, obs, fauna, portal
        );
    }

    /**
     * Level 2 — Young Anaconda Territory: Tapajós Shallows.
     * Larger territory with more vegetation, mud paths, rats, and river birds.
     */
    private LevelData buildLevel2() {
        double worldSize = 1800;
        Island island = new Island("Tapajós Basin", 0, 0, 1100, 850, 120);
        River river = new River(0, 1700, false);

        List<Obstacle> obs = new ArrayList<>();
        obs.add(new Obstacle(-320, -220, Obstacle.ObstacleType.KAPOK_TREE));
        obs.add(new Obstacle(340, -240, Obstacle.ObstacleType.KAPOK_TREE));
        obs.add(new Obstacle(-280, 260, Obstacle.ObstacleType.PALM_TREE));
        obs.add(new Obstacle(290, 240, Obstacle.ObstacleType.PALM_TREE));
        obs.add(new Obstacle(0, -200, Obstacle.ObstacleType.FALLEN_LOG));
        obs.add(new Obstacle(120, 180, Obstacle.ObstacleType.FALLEN_LOG));
        obs.add(new Obstacle(-180, 50, Obstacle.ObstacleType.RIVER_ROCK));
        obs.add(new Obstacle(220, -40, Obstacle.ObstacleType.RIVER_ROCK));

        List<Prey> fauna = new ArrayList<>();
        // Fish
        fauna.add(new FishPrey(-620, -180));
        fauna.add(new FishPrey(630, 150));
        // Frogs
        fauna.add(new FrogPrey(-420, -280));
        fauna.add(new FrogPrey(400, -260));
        fauna.add(new FrogPrey(0, 320));
        // Spiny Rats
        fauna.add(new RatPrey(-180, -120));
        fauna.add(new RatPrey(220, 140));
        fauna.add(new RatPrey(-100, 200));
        // Hoatzin Birds
        fauna.add(new BirdPrey(150, -120));
        fauna.add(new BirdPrey(-260, 60));

        RiverCrossingPortal portal = new RiverCrossingPortal(540, -120);

        return new LevelData(
                2, "Level 2: Young Anaconda Territory", "Tapajós Shallows",
                "Expand into denser forest. Hunt agile spiny rats and fluttering river birds. Quota: 5 prey.",
                5, worldSize, -200, 0, 0.0,
                island, river, obs, fauna, portal
        );
    }

    /**
     * Level 3 — Deep Rainforest: Igapó Wetlands.
     * Expansive flooded forest with fallen logs, wetlands, and capybaras.
     */
    private LevelData buildLevel3() {
        double worldSize = 2400;
        Island island = new Island("Igapó Flooded Forest", 0, 0, 1550, 1150, 140);
        River river = new River(0, 2300, true); // Horizontal river channel

        List<Obstacle> obs = new ArrayList<>();
        obs.add(new Obstacle(-500, -350, Obstacle.ObstacleType.KAPOK_TREE));
        obs.add(new Obstacle(520, -380, Obstacle.ObstacleType.KAPOK_TREE));
        obs.add(new Obstacle(-480, 380, Obstacle.ObstacleType.KAPOK_TREE));
        obs.add(new Obstacle(500, 350, Obstacle.ObstacleType.KAPOK_TREE));
        obs.add(new Obstacle(-200, -150, Obstacle.ObstacleType.PALM_TREE));
        obs.add(new Obstacle(240, 160, Obstacle.ObstacleType.PALM_TREE));
        obs.add(new Obstacle(0, 0, Obstacle.ObstacleType.FALLEN_LOG));
        obs.add(new Obstacle(-300, 180, Obstacle.ObstacleType.FALLEN_LOG));
        obs.add(new Obstacle(350, -180, Obstacle.ObstacleType.FALLEN_LOG));
        obs.add(new Obstacle(-120, -280, Obstacle.ObstacleType.RIVER_ROCK));
        obs.add(new Obstacle(180, 260, Obstacle.ObstacleType.RIVER_ROCK));

        List<Prey> fauna = new ArrayList<>();
        // Fish & Frogs
        fauna.add(new FishPrey(-300, -680));
        fauna.add(new FishPrey(320, 680));
        fauna.add(new FrogPrey(-560, -380));
        fauna.add(new FrogPrey(580, 360));
        // Rats & Birds
        fauna.add(new RatPrey(-320, -120));
        fauna.add(new RatPrey(380, -80));
        fauna.add(new BirdPrey(-140, 240));
        fauna.add(new BirdPrey(220, -260));
        // Capybaras (Large semi-aquatic prey!)
        fauna.add(new CapybaraPrey(-220, 80));
        fauna.add(new CapybaraPrey(280, 60));
        fauna.add(new CapybaraPrey(0, -320));

        RiverCrossingPortal portal = new RiverCrossingPortal(0, 560);

        return new LevelData(
                3, "Level 3: Deep Rainforest", "Igapó Flooded Forest",
                "Navigate flooded wetlands and fallen log bridges. Constrict large capybaras. Quota: 6 prey.",
                6, worldSize, -400, -200, 0.4,
                island, river, obs, fauna, portal
        );
    }

    /**
     * Level 4 — Riverbank Hunting Grounds: Marajó Estuary.
     * Broad rainforest with streams, sandbars, capybara herds, and spectacled caimans.
     */
    private LevelData buildLevel4() {
        double worldSize = 3000;
        Island island = new Island("Marajó Estuary", 0, 0, 1950, 1450, 160);
        River river = new River(0, 2900, false);

        List<Obstacle> obs = new ArrayList<>();
        obs.add(new Obstacle(-680, -450, Obstacle.ObstacleType.KAPOK_TREE));
        obs.add(new Obstacle(700, -480, Obstacle.ObstacleType.KAPOK_TREE));
        obs.add(new Obstacle(-650, 480, Obstacle.ObstacleType.KAPOK_TREE));
        obs.add(new Obstacle(680, 460, Obstacle.ObstacleType.KAPOK_TREE));
        obs.add(new Obstacle(-350, -200, Obstacle.ObstacleType.PALM_TREE));
        obs.add(new Obstacle(380, 220, Obstacle.ObstacleType.PALM_TREE));
        obs.add(new Obstacle(-150, 320, Obstacle.ObstacleType.FALLEN_LOG));
        obs.add(new Obstacle(200, -300, Obstacle.ObstacleType.FALLEN_LOG));
        obs.add(new Obstacle(-450, 100, Obstacle.ObstacleType.RIVER_ROCK));
        obs.add(new Obstacle(480, -100, Obstacle.ObstacleType.RIVER_ROCK));

        List<Prey> fauna = new ArrayList<>();
        // Small fauna
        fauna.add(new FishPrey(-1050, -300));
        fauna.add(new FishPrey(1080, 320));
        fauna.add(new FrogPrey(-720, 450));
        fauna.add(new RatPrey(-420, -320));
        fauna.add(new BirdPrey(480, -280));
        // Capybara family
        fauna.add(new CapybaraPrey(-300, 200));
        fauna.add(new CapybaraPrey(250, 180));
        fauna.add(new CapybaraPrey(-120, -150));
        fauna.add(new CapybaraPrey(350, -120));
        // Spectacled Caimans (Dangerous river reptiles)
        fauna.add(new CaimanPrey(-580, -180, false));
        fauna.add(new CaimanPrey(620, 240, false));

        RiverCrossingPortal portal = new RiverCrossingPortal(960, 220);

        return new LevelData(
                4, "Level 4: Riverbank Hunting Grounds", "Marajó Estuary",
                "Dominate the open estuary. Stalk capybaras and ambush armored spectacled caimans. Quota: 7 prey.",
                7, worldSize, -600, 0, 0.0,
                island, river, obs, fauna, portal
        );
    }

    /**
     * Level 5 — Giant Anaconda Territory: Anavilhanas Apex Basin.
     * Massive interconnected river archipelago; apex giant anaconda stage;
     * ultimate survival challenge featuring the Titan Black Caiman.
     */
    private LevelData buildLevel5() {
        double worldSize = 3600;
        Island island = new Island("Anavilhanas Arch", 0, 0, 2400, 1750, 180);
        River river = new River(0, 3500, true);

        List<Obstacle> obs = new ArrayList<>();
        obs.add(new Obstacle(-850, -550, Obstacle.ObstacleType.KAPOK_TREE));
        obs.add(new Obstacle(880, -580, Obstacle.ObstacleType.KAPOK_TREE));
        obs.add(new Obstacle(-820, 580, Obstacle.ObstacleType.KAPOK_TREE));
        obs.add(new Obstacle(850, 560, Obstacle.ObstacleType.KAPOK_TREE));
        obs.add(new Obstacle(-450, -250, Obstacle.ObstacleType.PALM_TREE));
        obs.add(new Obstacle(480, 280, Obstacle.ObstacleType.PALM_TREE));
        obs.add(new Obstacle(0, -350, Obstacle.ObstacleType.FALLEN_LOG));
        obs.add(new Obstacle(0, 350, Obstacle.ObstacleType.FALLEN_LOG));
        obs.add(new Obstacle(-550, 200, Obstacle.ObstacleType.RIVER_ROCK));
        obs.add(new Obstacle(580, -200, Obstacle.ObstacleType.RIVER_ROCK));

        List<Prey> fauna = new ArrayList<>();
        // Variety of fauna
        fauna.add(new FishPrey(-700, -980));
        fauna.add(new FishPrey(750, 980));
        fauna.add(new FrogPrey(-950, -420));
        fauna.add(new RatPrey(-520, -320));
        fauna.add(new BirdPrey(560, -300));
        // Large fauna
        fauna.add(new CapybaraPrey(-400, 220));
        fauna.add(new CapybaraPrey(420, 200));
        fauna.add(new CapybaraPrey(-200, -180));
        fauna.add(new CapybaraPrey(250, -150));
        fauna.add(new CaimanPrey(-650, 320, false));
        // Apex Titan Black Caiman Boss!
        fauna.add(new CaimanPrey(0, 0, true));

        RiverCrossingPortal portal = new RiverCrossingPortal(1150, 0);

        return new LevelData(
                5, "Level 5: Giant Anaconda Territory", "Anavilhanas Apex Basin",
                "Reign as the 14-meter Apex Titan. Subdue the prehistoric Titan Black Caiman and conquer the Amazon. Quota: 8 prey.",
                8, worldSize, -800, -300, 0.2,
                island, river, obs, fauna, portal
        );
    }
}
