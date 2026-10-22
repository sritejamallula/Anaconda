package ui;

import game.GameConfig;
import snake.Anaconda;

import java.awt.*;
import java.awt.geom.RoundRectangle2D;

/**
 * Tactical wildlife survival HUD.
 * Renders health, stamina, hunger, life-cycle growth stage, length metrics,
 * score counters, and dynamic level objective progression.
 */
public class GameHUD {

    public void render(Graphics2D g2, Anaconda anaconda, int levelNumber, String levelName,
                       int currentPreyEaten, int targetQuota, boolean portalUnlocked, int highScore) {
        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Top Navigation & Stats Bar
        int hudW = 1240;
        int hudH = 74;
        int hudX = 20;
        int hudY = 16;

        // Semi-transparent dark jungle glass container
        g.setColor(new Color(12, 22, 14, 215));
        g.fill(new RoundRectangle2D.Double(hudX, hudY, hudW, hudH, 16, 16));
        g.setColor(new Color(60, 110, 45, 160));
        g.setStroke(new BasicStroke(1.6f));
        g.draw(new RoundRectangle2D.Double(hudX, hudY, hudW, hudH, 16, 16));

        // 1. Level & Biome Badge (Left section)
        g.setFont(GameConfig.FONT_HUD);
        g.setColor(new Color(110, 220, 90));
        g.drawString("LEVEL " + levelNumber + ": " + levelName.toUpperCase(), hudX + 18, hudY + 28);

        // Growth Stage & Metric Length
        g.setFont(GameConfig.FONT_HUD_SMALL);
        g.setColor(new Color(230, 240, 220));
        String stageLabel = getGrowthStageTitle(anaconda.getGrowthStage()) +
                String.format(" | Length: %.1fm | Girth: %.0fpx", anaconda.getTotalLengthMeters(), anaconda.getBaseRadius() * 2);
        g.drawString(stageLabel, hudX + 18, hudY + 52);

        // 2. Vitals Meters (Center section)
        int vitalsX = hudX + 440;
        renderBar(g, vitalsX, hudY + 14, 160, 12, anaconda.getHealth() / anaconda.getMaxHealth(),
                new Color(220, 60, 60), new Color(120, 25, 25), "HEALTH");

        renderBar(g, vitalsX, hudY + 34, 160, 12, anaconda.getStamina() / anaconda.getMaxStamina(),
                new Color(60, 180, 240), new Color(20, 75, 110), "STAMINA");

        renderBar(g, vitalsX, hudY + 54, 160, 10, anaconda.getHunger() / 100.0,
                new Color(240, 180, 40), new Color(120, 85, 15), "ENERGY");

        // 3. Level Objective / River Crossing Progress (Right-Center)
        int objX = hudX + 640;
        g.setFont(GameConfig.FONT_HUD);
        if (portalUnlocked) {
            g.setColor(new Color(64, 255, 210));
            g.drawString("★ RIVER CROSSING UNLOCKED! ★", objX, hudY + 28);
            g.setFont(GameConfig.FONT_HUD_SMALL);
            g.setColor(Color.WHITE);
            g.drawString("Swim to the glowing river beacon to cross to next island", objX, hudY + 50);
        } else {
            g.setColor(new Color(255, 230, 140));
            g.drawString(String.format("OBJECTIVE: DEVOUR PREY (%d / %d)", currentPreyEaten, targetQuota), objX, hudY + 28);
            // Progress bar
            double progress = Math.min(1.0, (double) currentPreyEaten / targetQuota);
            renderProgressBar(g, objX, hudY + 38, 250, 14, progress);
        }

        // 4. Score Counters (Right section)
        int scoreX = hudX + hudW - 220;
        g.setFont(GameConfig.FONT_HUD);
        g.setColor(Color.WHITE);
        g.drawString(String.format("SCORE: %,d", anaconda.getScore()), scoreX, hudY + 30);
        g.setFont(GameConfig.FONT_HUD_SMALL);
        g.setColor(new Color(180, 205, 165));
        g.drawString(String.format("HIGH SCORE: %,d", Math.max(anaconda.getScore(), highScore)), scoreX, hudY + 52);

        // Bottom Controls Reminder Pill
        renderBottomControlsPill(g);

        g.dispose();
    }

    private void renderBar(Graphics2D g, int x, int y, int w, int h, double ratio, Color fillCol, Color bgCol, String label) {
        g.setFont(new Font("SansSerif", Font.BOLD, 10));
        g.setColor(new Color(180, 195, 175));
        g.drawString(label, x - 54, y + 10);

        g.setColor(bgCol);
        g.fillRoundRect(x, y, w, h, 6, 6);

        int fillW = (int) (w * Math.max(0.0, Math.min(1.0, ratio)));
        g.setColor(fillCol);
        g.fillRoundRect(x, y, fillW, h, 6, 6);

        g.setColor(new Color(255, 255, 255, 60));
        g.drawRoundRect(x, y, w, h, 6, 6);
    }

    private void renderProgressBar(Graphics2D g, int x, int y, int w, int h, double progress) {
        g.setColor(new Color(30, 45, 25));
        g.fillRoundRect(x, y, w, h, 8, 8);

        int fillW = (int) (w * progress);
        GradientPaint grad = new GradientPaint(
                x, y, new Color(80, 220, 100),
                x + w, y, new Color(40, 160, 240)
        );
        g.setPaint(grad);
        g.fillRoundRect(x, y, fillW, h, 8, 8);

        g.setColor(new Color(255, 255, 255, 80));
        g.drawRoundRect(x, y, w, h, 8, 8);
    }

    private void renderBottomControlsPill(Graphics2D g) {
        int pillW = 720;
        int pillH = 26;
        int pillX = (1280 - pillW) / 2;
        int pillY = 720 - 36;

        g.setColor(new Color(10, 18, 12, 190));
        g.fillRoundRect(pillX, pillY, pillW, pillH, 14, 14);
        g.setColor(new Color(50, 90, 40, 150));
        g.drawRoundRect(pillX, pillY, pillW, pillH, 14, 14);

        g.setFont(GameConfig.FONT_HUD_SMALL);
        g.setColor(new Color(200, 225, 190));
        String hints = "WASD/Arrows: Slither  |  [SPACE]: Strike  |  [SHIFT]: Sprint  |  [T]: Thermal Vision  |  [P]: Pause  |  [M]: Audio";
        FontMetrics fm = g.getFontMetrics();
        g.drawString(hints, pillX + (pillW - fm.stringWidth(hints)) / 2, pillY + 17);
    }

    private String getGrowthStageTitle(int stage) {
        switch (stage) {
            case 1: return "Stage 1: Juvenile";
            case 2: return "Stage 2: Sub-Adult";
            case 3: return "Stage 3: Full Adult";
            case 4: return "Stage 4: Giant Matriarch";
            case 5: default: return "Stage 5: Apex Titan";
        }
    }
}
