package ui;

import animals.FaunaManager;
import animals.Prey;
import animals.PreyType;
import game.GameConfig;

import java.awt.*;
import java.awt.geom.RoundRectangle2D;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Bottom-left HUD panel displaying the roster of prey species on the current island,
 * showing live hunting status, point rewards, and collection counts.
 */
public class PreyCollectionPanel {

    public void render(Graphics2D g2, FaunaManager faunaManager) {
        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Find unique species present in the level
        Set<PreyType> speciesInLevel = new LinkedHashSet<>();
        for (Prey p : faunaManager.getActivePrey()) {
            speciesInLevel.add(p.getType());
        }

        if (speciesInLevel.isEmpty()) {
            g.dispose();
            return;
        }

        int panelW = 270;
        int rowH = 22;
        int panelH = 34 + speciesInLevel.size() * rowH;
        int panelX = 20;
        int panelY = 720 - panelH - 45;

        // Semi-transparent dark glass background
        g.setColor(new Color(10, 20, 14, 215));
        g.fill(new RoundRectangle2D.Double(panelX, panelY, panelW, panelH, 12, 12));
        g.setColor(new Color(55, 100, 45, 170));
        g.setStroke(new BasicStroke(1.4f));
        g.draw(new RoundRectangle2D.Double(panelX, panelY, panelW, panelH, 12, 12));

        // Header Title
        g.setFont(new Font("SansSerif", Font.BOLD, 12));
        g.setColor(new Color(130, 230, 100));
        g.drawString("FAUNA COLLECTION ROSTER", panelX + 14, panelY + 20);

        // Species entries
        int curY = panelY + 40;
        g.setFont(GameConfig.FONT_HUD_SMALL);

        for (PreyType type : speciesInLevel) {
            int remaining = faunaManager.getRemainingCount(type);
            int eaten = faunaManager.getEatenCount(type);

            // Species colored icon dot
            g.setColor(type.radarColor);
            g.fillOval(panelX + 14, curY - 9, 9, 9);

            // Name
            g.setColor(Color.WHITE);
            String name = type.commonName;
            if (name.length() > 16) name = name.substring(0, 14) + "..";
            g.drawString(name, panelX + 30, curY);

            // Hunting Status
            if (eaten > 0) {
                g.setColor(new Color(80, 240, 100));
                g.drawString(String.format("✓ Hunted (%d)", eaten), panelX + 160, curY);
            } else {
                g.setColor(new Color(240, 180, 50));
                g.drawString(String.format("%d Left", remaining), panelX + 160, curY);
            }

            curY += rowH;
        }

        g.dispose();
    }
}
