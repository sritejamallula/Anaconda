package ui;

import game.GameConfig;

import java.awt.*;
import java.awt.geom.RoundRectangle2D;

/**
 * River Crossing & Level Completed Celebration Screen.
 * Displays expedition summary, growth evolution metrics, score bonus,
 * and button to transition across the river to the next island outpost.
 */
public class LevelCompleteOverlay {
    public enum LevelOverlayAction {
        NONE,
        ADVANCE_LEVEL,
        RETURN_TO_MENU
    }

    private final Rectangle advanceButton = new Rectangle();
    private final Rectangle menuButton = new Rectangle();
    private boolean isHoveredAdvance = false;
    private boolean isHoveredMenu = false;
    private double animTime = 0.0;

    public LevelCompleteOverlay(int screenW, int screenH) {
        layoutButtons(screenW, screenH);
    }

    public void layoutButtons(int screenW, int screenH) {
        int btnW = 280;
        int btnH = 46;
        int btnY = screenH / 2 + 110;

        advanceButton.setBounds(screenW / 2 - btnW - 15, btnY, btnW, btnH);
        menuButton.setBounds(screenW / 2 + 15, btnY, btnW, btnH);
    }

    public void update(double dt) {
        animTime += dt;
    }

    public void handleMouseMove(int mx, int my) {
        isHoveredAdvance = advanceButton.contains(mx, my);
        isHoveredMenu = menuButton.contains(mx, my);
    }

    public LevelOverlayAction handleMouseClick(int mx, int my) {
        if (advanceButton.contains(mx, my)) {
            return LevelOverlayAction.ADVANCE_LEVEL;
        } else if (menuButton.contains(mx, my)) {
            return LevelOverlayAction.RETURN_TO_MENU;
        }
        return LevelOverlayAction.NONE;
    }

    public void render(Graphics2D g2, int levelNumber, String levelName, int score,
                       double totalLength, int stage, boolean isFinalLevel, int screenW, int screenH) {
        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Dark river-water translucent backdrop
        g.setColor(new Color(8, 28, 36, 225));
        g.fillRect(0, 0, screenW, screenH);

        // Center card
        int cardW = 680;
        int cardH = 400;
        int cardX = (screenW - cardW) / 2;
        int cardY = (screenH - cardH) / 2 - 20;

        g.setColor(new Color(16, 42, 48, 245));
        g.fill(new RoundRectangle2D.Double(cardX, cardY, cardW, cardH, 20, 20));
        g.setColor(new Color(40, 180, 200));
        g.setStroke(new BasicStroke(2.2f));
        g.draw(new RoundRectangle2D.Double(cardX, cardY, cardW, cardH, 20, 20));

        // Triumphant Banner Title
        g.setFont(GameConfig.FONT_TITLE);
        String title = isFinalLevel ? "AMAZON APEX CONQUERED!" : "RIVER CROSSING SUCCESSFUL!";
        FontMetrics fm = g.getFontMetrics();
        g.setColor(isFinalLevel ? new Color(255, 215, 60) : new Color(64, 255, 220));
        g.drawString(title, (screenW - fm.stringWidth(title)) / 2, cardY + 60);

        // Subtitle
        g.setFont(GameConfig.FONT_SUBTITLE);
        String sub = isFinalLevel
                ? "You have reigned as the 14-meter Titan of the Amazon Basin!"
                : "Traversing the open Amazon river to the next island outpost...";
        FontMetrics fmSub = g.getFontMetrics();
        g.setColor(new Color(230, 245, 240));
        g.drawString(sub, (screenW - fmSub.stringWidth(sub)) / 2, cardY + 98);

        // Statistics Divider
        g.setColor(new Color(60, 120, 130, 140));
        g.drawLine(cardX + 40, cardY + 120, cardX + cardW - 40, cardY + 120);

        // Expedition Summary Data
        g.setFont(GameConfig.FONT_HUD);
        g.setColor(Color.WHITE);
        int statY = cardY + 160;
        g.drawString(String.format("Territory Cleared: Level %d (%s)", levelNumber, levelName), cardX + 70, statY);
        g.drawString(String.format("Current Score: %,d pts (+1,000 Level Bonus)", score), cardX + 70, statY + 30);
        g.drawString(String.format("Anaconda Total Length: %.1f meters (Stage %d)", totalLength, stage), cardX + 70, statY + 60);

        // Advance Button
        g.setColor(isHoveredAdvance ? new Color(30, 160, 180) : new Color(20, 100, 115));
        g.fill(new RoundRectangle2D.Double(advanceButton.x, advanceButton.y, advanceButton.width, advanceButton.height, 12, 12));
        g.setColor(isHoveredAdvance ? new Color(120, 255, 240) : new Color(50, 180, 200));
        g.setStroke(new BasicStroke(isHoveredAdvance ? 2.2f : 1.4f));
        g.draw(new RoundRectangle2D.Double(advanceButton.x, advanceButton.y, advanceButton.width, advanceButton.height, 12, 12));

        String advLabel = isFinalLevel ? "PLAY AGAIN" : "SWIM TO NEXT ISLAND";
        FontMetrics fmAdv = g.getFontMetrics();
        g.setColor(Color.WHITE);
        g.drawString(advLabel, advanceButton.x + (advanceButton.width - fmAdv.stringWidth(advLabel)) / 2, advanceButton.y + 28);

        // Menu Button
        g.setColor(isHoveredMenu ? new Color(70, 90, 80) : new Color(35, 50, 45));
        g.fill(new RoundRectangle2D.Double(menuButton.x, menuButton.y, menuButton.width, menuButton.height, 12, 12));
        g.setColor(isHoveredMenu ? Color.WHITE : new Color(100, 130, 120));
        g.draw(new RoundRectangle2D.Double(menuButton.x, menuButton.y, menuButton.width, menuButton.height, 12, 12));

        String menuLabel = "RETURN TO MENU";
        FontMetrics fmMnu = g.getFontMetrics();
        g.setColor(new Color(220, 230, 225));
        g.drawString(menuLabel, menuButton.x + (menuButton.width - fmMnu.stringWidth(menuLabel)) / 2, menuButton.y + 28);

        g.dispose();
    }
}
