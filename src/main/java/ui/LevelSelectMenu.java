package ui;

import game.GameConfig;
import save.SaveManager;

import java.awt.*;
import java.awt.geom.RoundRectangle2D;

/**
 * Level Selection Menu allowing players to pick unlocked Amazon territories (Levels 1 to 5).
 */
public class LevelSelectMenu {
    private final Rectangle[] levelCards = new Rectangle[5];
    private final Rectangle backButton = new Rectangle();
    private int hoveredLevel = -1;
    private boolean isHoveredBack = false;

    private static final String[] LEVEL_NAMES = {
            "Level 1: Nursery Shallows",
            "Level 2: Tapajós Shallows",
            "Level 3: Igapó Wetlands",
            "Level 4: Marajó Estuary",
            "Level 5: Anavilhanas Apex"
    };

    private static final String[] LEVEL_DESC = {
            "Small river island. Hunt catfish & tree frogs. Quota: 3 prey.",
            "Young territory. Scurrying rats & hoatzin birds. Quota: 5 prey.",
            "Deep flooded forest. Ambush swimming capybaras. Quota: 6 prey.",
            "Expansive estuary. Spectacled caiman encounters. Quota: 7 prey.",
            "Massive arch. Reign as Titan against Black Caiman. Quota: 8 prey."
    };

    public LevelSelectMenu(int screenW, int screenH) {
        layoutComponents(screenW, screenH);
    }

    public void layoutComponents(int screenW, int screenH) {
        int cardW = 540;
        int cardH = 68;
        int startY = 150;
        int spacing = 82;

        for (int i = 0; i < levelCards.length; i++) {
            int cx = (screenW - cardW) / 2;
            int cy = startY + i * spacing;
            levelCards[i] = new Rectangle(cx, cy, cardW, cardH);
        }

        backButton.setBounds((screenW - 220) / 2, screenH - 80, 220, 42);
    }

    public void handleMouseMove(int mx, int my) {
        hoveredLevel = -1;
        for (int i = 0; i < levelCards.length; i++) {
            if (levelCards[i].contains(mx, my)) {
                hoveredLevel = i;
                break;
            }
        }
        isHoveredBack = backButton.contains(mx, my);
    }

    public int handleMouseClick(int mx, int my) {
        int unlocked = SaveManager.getInstance().getHighestUnlockedLevel();
        for (int i = 0; i < levelCards.length; i++) {
            if (levelCards[i].contains(mx, my)) {
                if (i + 1 <= unlocked) {
                    return i + 1; // Load this level (1 to 5)
                }
            }
        }
        if (backButton.contains(mx, my)) {
            return 0; // Return to Main Menu
        }
        return -1;
    }

    public void render(Graphics2D g2, int screenW, int screenH) {
        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Backdrop
        g.setColor(new Color(8, 22, 14, 235));
        g.fillRect(0, 0, screenW, screenH);

        // Title
        g.setFont(GameConfig.FONT_TITLE);
        g.setColor(new Color(130, 235, 100));
        String title = "AMAZON EXPEDITIONS — LEVEL SELECT";
        FontMetrics fm = g.getFontMetrics();
        g.drawString(title, (screenW - fm.stringWidth(title)) / 2, 90);

        int unlocked = SaveManager.getInstance().getHighestUnlockedLevel();

        // Level Cards
        for (int i = 0; i < levelCards.length; i++) {
            Rectangle card = levelCards[i];
            boolean isUnlocked = (i + 1 <= unlocked);
            boolean isHovered = (i == hoveredLevel && isUnlocked);

            // Card Background
            if (!isUnlocked) {
                g.setColor(new Color(18, 26, 20, 180));
            } else if (isHovered) {
                g.setColor(new Color(36, 92, 46, 230));
            } else {
                g.setColor(new Color(20, 50, 28, 200));
            }
            g.fill(new RoundRectangle2D.Double(card.x, card.y, card.width, card.height, 14, 14));

            // Border
            Color borderColor = isUnlocked
                    ? (isHovered ? new Color(140, 255, 120) : new Color(60, 130, 60))
                    : new Color(50, 60, 50);
            g.setColor(borderColor);
            g.setStroke(new BasicStroke(isHovered ? 2.0f : 1.2f));
            g.draw(new RoundRectangle2D.Double(card.x, card.y, card.width, card.height, 14, 14));

            // Level Title
            g.setFont(GameConfig.FONT_HUD);
            g.setColor(isUnlocked ? Color.WHITE : new Color(110, 120, 110));
            g.drawString(LEVEL_NAMES[i], card.x + 24, card.y + 28);

            // Description
            g.setFont(GameConfig.FONT_HUD_SMALL);
            g.setColor(isUnlocked ? new Color(190, 220, 180) : new Color(80, 90, 80));
            g.drawString(LEVEL_DESC[i], card.x + 24, card.y + 50);

            // Lock / Play Badge
            if (isUnlocked) {
                g.setColor(new Color(80, 240, 120));
                g.drawString("ENTER [▶]", card.x + card.width - 85, card.y + 38);
            } else {
                g.setColor(new Color(200, 80, 60));
                g.drawString("LOCKED [🔒]", card.x + card.width - 95, card.y + 38);
            }
        }

        // Back Button
        g.setColor(isHoveredBack ? new Color(50, 110, 60) : new Color(25, 60, 35));
        g.fill(new RoundRectangle2D.Double(backButton.x, backButton.y, backButton.width, backButton.height, 12, 12));
        g.setColor(isHoveredBack ? Color.WHITE : new Color(80, 150, 90));
        g.draw(new RoundRectangle2D.Double(backButton.x, backButton.y, backButton.width, backButton.height, 12, 12));

        g.setFont(GameConfig.FONT_HUD);
        g.setColor(Color.WHITE);
        String backStr = "RETURN TO MENU";
        FontMetrics fmBk = g.getFontMetrics();
        g.drawString(backStr, backButton.x + (backButton.width - fmBk.stringWidth(backStr)) / 2, backButton.y + 26);

        g.dispose();
    }
}
