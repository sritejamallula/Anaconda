package ui;

import game.GameConfig;

import java.awt.*;
import java.awt.geom.RoundRectangle2D;

/**
 * Wildlife Field Guide and Controls Modal.
 * Documents controls, green anaconda biology, and ecological prey profiles.
 */
public class FieldGuideModal {
    private final Rectangle closeButton = new Rectangle();
    private boolean isHoveredClose = false;

    public FieldGuideModal(int screenW, int screenH) {
        layoutButtons(screenW, screenH);
    }

    public void layoutButtons(int screenW, int screenH) {
        int btnW = 180;
        int btnH = 38;
        int cardY = (screenH - 520) / 2;
        closeButton.setBounds((screenW - btnW) / 2, cardY + 520 - 55, btnW, btnH);
    }

    public void handleMouseMove(int mx, int my) {
        isHoveredClose = closeButton.contains(mx, my);
    }

    public boolean handleMouseClick(int mx, int my) {
        return closeButton.contains(mx, my);
    }

    public void render(Graphics2D g2, int screenW, int screenH) {
        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Backdrop
        g.setColor(new Color(6, 14, 10, 220));
        g.fillRect(0, 0, screenW, screenH);

        // Center modal
        int cardW = 860;
        int cardH = 520;
        int cardX = (screenW - cardW) / 2;
        int cardY = (screenH - cardH) / 2;

        g.setColor(new Color(16, 32, 22, 250));
        g.fill(new RoundRectangle2D.Double(cardX, cardY, cardW, cardH, 20, 20));
        g.setColor(new Color(60, 130, 75));
        g.setStroke(new BasicStroke(2.0f));
        g.draw(new RoundRectangle2D.Double(cardX, cardY, cardW, cardH, 20, 20));

        // Header Title
        g.setFont(GameConfig.FONT_TITLE);
        g.setColor(new Color(130, 235, 100));
        String title = "AMAZON FIELD GUIDE & CONTROLS";
        FontMetrics fm = g.getFontMetrics();
        g.drawString(title, (screenW - fm.stringWidth(title)) / 2, cardY + 44);

        // Two Columns: Left = Controls, Right = Wildlife Ecology
        int col1X = cardX + 45;
        int col2X = cardX + 440;
        int contentY = cardY + 80;

        // Left Column: Controls & Mechanics
        g.setFont(GameConfig.FONT_SUBTITLE);
        g.setColor(new Color(255, 225, 120));
        g.drawString("Survival Controls", col1X, contentY);

        g.setFont(GameConfig.FONT_HUD_SMALL);
        g.setColor(new Color(225, 235, 220));
        String[] controls = {
                "• WASD / Arrow Keys : Slither & Steer heading smoothly",
                "• [SPACEBAR] / L-Click : Fast Lunging Strike towards prey",
                "• [SHIFT] : Slither Burst / Sprint (Consumes Stamina)",
                "• [T] Key : Thermal Pit Vision (Infrared Heat-Sensing)",
                "• [P] / [ESC] : Pause / Resume Game",
                "• [M] Key : Toggle Audio & Rainforest Soundscape",
                "• [H] / [F1] : Toggle This Field Guide Modal"
        };
        int cy = contentY + 28;
        for (String c : controls) {
            g.drawString(c, col1X, cy);
            cy += 24;
        }

        // Biology notes
        cy += 10;
        g.setFont(GameConfig.FONT_SUBTITLE);
        g.setColor(new Color(255, 225, 120));
        g.drawString("Green Anaconda Anatomy", col1X, cy);
        g.setFont(GameConfig.FONT_HUD_SMALL);
        g.setColor(new Color(200, 220, 195));
        cy += 24;
        g.drawString("• Scientific Name: Eunectes murinus (Heaviest snake on Earth)", col1X, cy);
        cy += 20;
        g.drawString("• Sinuous Path Physics: Continuous arc-length spine locomotion", col1X, cy);
        cy += 20;
        g.drawString("• Unhinged Jaw: Quadrate bone hinges open 140° for large prey", col1X, cy);
        cy += 20;
        g.drawString("• Digestion Bulge: Ingested prey visibly traverses body segments", col1X, cy);

        // Right Column: Amazon Ecosystem Fauna
        g.setFont(GameConfig.FONT_SUBTITLE);
        g.setColor(new Color(255, 225, 120));
        g.drawString("Amazonian Prey Fauna", col2X, contentY);

        String[] faunaDescriptions = {
                "• Emerald Catfish: Shallow water swimmer (150 pts)",
                "• Amazon Tree Frog: Damp bank hopper (200 pts)",
                "• Forest Spiny Rat: Fast ground floor scurry (350 pts)",
                "• Hoatzin River Bird: Feathery crest, flutter wings (450 pts)",
                "• Capybara: Semi-aquatic mega-rodent, grazes banks (850 pts)",
                "• Spectacled Caiman: Armored predator, river channels (1,400 pts)",
                "• Titan Black Caiman: 12m prehistoric apex boss (2,800 pts)"
        };
        int fy = contentY + 28;
        g.setFont(GameConfig.FONT_HUD_SMALL);
        g.setColor(new Color(225, 235, 220));
        for (String f : faunaDescriptions) {
            g.drawString(f, col2X, fy);
            fy += 26;
        }

        // Close Button
        g.setColor(isHoveredClose ? new Color(50, 140, 70) : new Color(30, 80, 45));
        g.fill(new RoundRectangle2D.Double(closeButton.x, closeButton.y, closeButton.width, closeButton.height, 10, 10));
        g.setColor(isHoveredClose ? new Color(140, 255, 120) : new Color(70, 130, 80));
        g.draw(new RoundRectangle2D.Double(closeButton.x, closeButton.y, closeButton.width, closeButton.height, 10, 10));

        g.setFont(GameConfig.FONT_HUD);
        g.setColor(Color.WHITE);
        String closeStr = "CLOSE GUIDE";
        FontMetrics fmCl = g.getFontMetrics();
        g.drawString(closeStr, closeButton.x + (closeButton.width - fmCl.stringWidth(closeStr)) / 2, closeButton.y + 24);

        g.dispose();
    }
}
