package animals;

import java.awt.Color;

/**
 * Ecologically authentic Amazonian prey species metadata.
 * Defines trophic attributes, biological names, point values, and radar blip signatures.
 */
public enum PreyType {
    EMERALD_CATFISH(
            "Amazon Emerald Catfish", "Corydoras splendens",
            150, 15.0, 0.7, Habitat.WATER, 75.0, 110.0,
            new Color(40, 200, 220)
    ),
    TREE_FROG(
            "Amazon Tree Frog", "Osteocephalus taurinus",
            200, 20.0, 0.8, Habitat.SHORELINE, 60.0, 90.0,
            new Color(80, 230, 60)
    ),
    SPINY_RAT(
            "Forest Spiny Rat", "Proechimys guyannensis",
            350, 32.0, 1.1, Habitat.FOREST_FLOOR, 95.0, 130.0,
            new Color(210, 160, 90)
    ),
    HOATZIN_BIRD(
            "Hoatzin Amazon Bird", "Opisthocomus hoazin",
            450, 40.0, 1.25, Habitat.CLEARING, 105.0, 150.0,
            new Color(245, 140, 30)
    ),
    CAPYBARA(
            "Capybara", "Hydrochoerus hydrochaeris",
            850, 75.0, 1.9, Habitat.SHORELINE, 80.0, 180.0,
            new Color(160, 105, 55)
    ),
    SPECTACLED_CAIMAN(
            "Spectacled Caiman", "Caiman crocodilus",
            1400, 110.0, 2.3, Habitat.WATER, 90.0, 220.0,
            new Color(60, 110, 50)
    ),
    BLACK_CAIMAN(
            "Titan Black Caiman", "Melanosuchus niger",
            2800, 180.0, 3.0, Habitat.WATER, 110.0, 260.0,
            new Color(25, 30, 25)
    );

    public enum Habitat {
        WATER,
        SHORELINE,
        FOREST_FLOOR,
        CLEARING
    }

    public final String commonName;
    public final String scientificName;
    public final int pointValue;
    public final double nutrition;
    public final double sizeMultiplier;
    public final Habitat habitat;
    public final double baseSpeed;
    public final double alertRadius;
    public final Color radarColor;

    PreyType(String commonName, String scientificName, int pointValue, double nutrition,
             double sizeMultiplier, Habitat habitat, double baseSpeed, double alertRadius, Color radarColor) {
        this.commonName = commonName;
        this.scientificName = scientificName;
        this.pointValue = pointValue;
        this.nutrition = nutrition;
        this.sizeMultiplier = sizeMultiplier;
        this.habitat = habitat;
        this.baseSpeed = baseSpeed;
        this.alertRadius = alertRadius;
        this.radarColor = radarColor;
    }
}
