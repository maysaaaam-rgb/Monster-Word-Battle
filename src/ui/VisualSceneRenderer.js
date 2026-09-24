import Phaser from 'phaser';

export default class VisualSceneRenderer {
  /**
   * Renders an educational mini-scene into a container or card.
   * @param {Phaser.Scene} scene
   * @param {Phaser.GameObjects.Container} container
   * @param {Object} spec - Scene specification from questions.js
   * @param {number} width - Target width of the scene frame
   * @param {number} height - Target height of the scene frame
   */
  static render(scene, container, spec, width = 160, height = 120) {
    // 1. Soft interior card backdrop (light cream/pale beige as in reference)
    const bg = scene.add.graphics();
    bg.fillStyle(0xf8f9fa, 1);
    bg.fillRoundedRect(0, 0, width, height, 12);
    bg.lineStyle(2, 0xdcdde1, 1);
    bg.strokeRoundedRect(0, 0, width, height, 12);

    // Warm floor shadow / grass line
    bg.fillStyle(0xe4e7eb, 1);
    bg.fillRoundedRect(6, height - 22, width - 12, 16, 6);

    container.add(bg);

    const gfx = scene.add.graphics();
    container.add(gfx);

    if (spec.type === 'path' || spec.type === 'turn' || spec.type === 'fork') {
      this.renderDirectionScene(gfx, spec, width, height);
    } else {
      this.renderPrepositionScene(gfx, spec, width, height);
    }
  }

  // ==========================================
  // PREPOSITIONS RENDERING
  // ==========================================
  static renderPrepositionScene(gfx, spec, width, height) {
    const { subject = 'cat', anchor = 'box', relation = 'on' } = spec;
    const midX = width / 2;
    const floorY = height - 16;

    if (anchor === 'box' || anchor === 'table') {
      const boxW = 68;
      const boxH = 50;
      const boxX = midX;
      const boxY = floorY - boxH;

      if (relation === 'in') {
        // Cardboard box with flaps: draw back & interior, then cat, then front flaps
        this.drawCardboardBoxOpen(gfx, boxX, boxY, boxW, boxH);
        this.drawCuteCat(gfx, boxX, boxY + 18, 0.72);
        this.drawCardboardBoxFront(gfx, boxX, boxY, boxW, boxH);
      } else if (relation === 'on') {
        // Wooden crate with cat on top
        this.drawWoodenCrate(gfx, boxX, boxY, boxW, boxH);
        this.drawCuteCat(gfx, boxX, boxY - 14, 0.75);
      } else if (relation === 'under') {
        // Cardboard box propped over cat / cat underneath
        this.drawCuteCat(gfx, boxX, floorY - 14, 0.68);
        this.drawBoxProppedUnder(gfx, boxX, boxY, boxW, boxH);
      } else if (relation === 'next to') {
        this.drawWoodenCrate(gfx, midX + 25, boxY, boxW - 12, boxH);
        this.drawCuteCat(gfx, midX - 35, floorY - 15, 0.75);
      } else if (relation === 'behind') {
        this.drawCuteCat(gfx, boxX, boxY - 10, 0.72);
        this.drawWoodenCrate(gfx, boxX, boxY, boxW, boxH);
      } else if (relation === 'in front of') {
        this.drawWoodenCrate(gfx, boxX, boxY - 10, boxW, boxH);
        this.drawCuteCat(gfx, boxX, floorY - 14, 0.78);
      } else if (relation === 'near') {
        this.drawWoodenCrate(gfx, midX + 28, boxY, boxW - 12, boxH);
        this.drawCuteCat(gfx, midX - 38, floorY - 15, 0.75);
        // Yellow dotted attention ring
        gfx.lineStyle(2, 0xf1c40f, 0.8);
        gfx.strokeCircle(midX - 38, floorY - 15, 20);
      }
    } else if (anchor === 'trees') {
      if (relation === 'between') {
        this.drawTreeMini(gfx, midX - 48, floorY - 45, 0.55);
        this.drawTreeMini(gfx, midX + 48, floorY - 45, 0.55);
        this.drawCuteCat(gfx, midX, floorY - 15, 0.72);
      }
    }
  }

  // ==========================================
  // CARDBOARD BOX & WOODEN CRATE
  // ==========================================
  static drawCardboardBoxOpen(gfx, x, y, w, h) {
    // Open flaps on sides
    gfx.fillStyle(0xd29b63, 1);
    gfx.lineStyle(2, 0x8b572a, 1);

    // Left flap
    gfx.fillTriangle(x - w / 2, y, x - w / 2 - 12, y - 10, x - w / 2 + 10, y);
    // Right flap
    gfx.fillTriangle(x + w / 2, y, x + w / 2 + 12, y - 10, x + w / 2 - 10, y);

    // Box body interior (darker brown)
    gfx.fillStyle(0xa76834, 1);
    gfx.fillRect(x - w / 2, y, w, h);
  }

  static drawCardboardBoxFront(gfx, x, y, w, h) {
    // Front face
    gfx.fillStyle(0xe5b27e, 1);
    gfx.lineStyle(2, 0x8b572a, 1);
    gfx.fillRoundedRect(x - w / 2, y + h * 0.45, w, h * 0.55, 4);
    gfx.strokeRoundedRect(x - w / 2, y + h * 0.45, w, h * 0.55, 4);

    // Front flaps hanging down
    gfx.fillStyle(0xd29b63, 1);
    gfx.fillTriangle(x - w / 2 + 4, y + h * 0.45, x - 5, y + h * 0.45, x - w / 4, y + h * 0.65);
    gfx.fillTriangle(x + 5, y + h * 0.45, x + w / 2 - 4, y + h * 0.45, x + w / 4, y + h * 0.65);
  }

  static drawWoodenCrate(gfx, x, y, w, h) {
    // Sturdy wooden crate with diagonal braces (as in reference image)
    gfx.fillStyle(0xc8823b, 1);
    gfx.lineStyle(2, 0x784415, 1);
    gfx.fillRoundedRect(x - w / 2, y, w, h, 4);
    gfx.strokeRoundedRect(x - w / 2, y, w, h, 4);

    // Planks / Diagonal brace
    gfx.lineStyle(2, 0x784415, 1);
    gfx.lineBetween(x - w / 2 + 4, y + 4, x + w / 2 - 4, y + h - 4);
    gfx.lineBetween(x - w / 2 + 4, y + h - 4, x + w / 2 - 4, y + 4);
    gfx.strokeRect(x - w / 2 + 3, y + 3, w - 6, h - 6);
  }

  static drawBoxProppedUnder(gfx, x, y, w, h) {
    // Propped cardboard box like a tent over the cat
    gfx.fillStyle(0xe5b27e, 1);
    gfx.lineStyle(2, 0x8b572a, 1);
    gfx.fillTriangle(x - w / 2 - 6, y + h, x, y - 8, x + w / 2 + 6, y + h);
    gfx.strokeTriangle(x - w / 2 - 6, y + h, x, y - 8, x + w / 2 + 6, y + h);

    // Dark interior shadow where cat sits
    gfx.fillStyle(0x6e3b12, 0.7);
    gfx.fillTriangle(x - w / 2 + 4, y + h, x, y + 8, x + w / 2 - 4, y + h);
  }

  // ==========================================
  // CUTE CAT ILLUSTRATION (Matching reference art)
  // ==========================================
  static drawCuteCat(gfx, x, y, scale = 1) {
    // Little Body
    gfx.fillStyle(0x718093, 1);
    gfx.lineStyle(2 * scale, 0x2f3640, 1);
    gfx.fillRoundedRect(x - 12 * scale, y - 6 * scale, 24 * scale, 20 * scale, 8 * scale);
    gfx.strokeRoundedRect(x - 12 * scale, y - 6 * scale, 24 * scale, 20 * scale, 8 * scale);

    // White chest patch
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(x, y + 2 * scale, 7 * scale);

    // Round Head
    gfx.fillStyle(0xdcdde1, 1);
    gfx.fillCircle(x, y - 16 * scale, 14 * scale);
    gfx.strokeCircle(x, y - 16 * scale, 14 * scale);

    // Pointy Ears with Pink Inside
    gfx.fillStyle(0x718093, 1);
    gfx.fillTriangle(x - 13 * scale, y - 22 * scale, x - 5 * scale, y - 30 * scale, x - 3 * scale, y - 18 * scale);
    gfx.fillTriangle(x + 13 * scale, y - 22 * scale, x + 5 * scale, y - 30 * scale, x + 3 * scale, y - 18 * scale);
    gfx.fillStyle(0xffa8a8, 1);
    gfx.fillTriangle(x - 11 * scale, y - 22 * scale, x - 6 * scale, y - 27 * scale, x - 4 * scale, y - 19 * scale);
    gfx.fillTriangle(x + 11 * scale, y - 22 * scale, x + 6 * scale, y - 27 * scale, x + 4 * scale, y - 19 * scale);

    // Big Cute Eyes
    gfx.fillStyle(0x2f3640, 1);
    gfx.fillCircle(x - 5 * scale, y - 16 * scale, 3.5 * scale);
    gfx.fillCircle(x + 5 * scale, y - 16 * scale, 3.5 * scale);
    // Highlights
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(x - 6 * scale, y - 18 * scale, 1.5 * scale);
    gfx.fillCircle(x + 4 * scale, y - 18 * scale, 1.5 * scale);

    // Pink nose
    gfx.fillStyle(0xff6b81, 1);
    gfx.fillTriangle(x - 2 * scale, y - 12 * scale, x + 2 * scale, y - 12 * scale, x, y - 10 * scale);

    // Whiskers
    gfx.lineStyle(1.5 * scale, 0x2f3640, 0.8);
    gfx.lineBetween(x - 6 * scale, y - 12 * scale, x - 15 * scale, y - 14 * scale);
    gfx.lineBetween(x - 6 * scale, y - 10 * scale, x - 15 * scale, y - 9 * scale);
    gfx.lineBetween(x + 6 * scale, y - 12 * scale, x + 15 * scale, y - 14 * scale);
    gfx.lineBetween(x + 6 * scale, y - 10 * scale, x + 15 * scale, y - 9 * scale);

    // Front paws
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(x - 6 * scale, y + 10 * scale, 4 * scale);
    gfx.fillCircle(x + 6 * scale, y + 10 * scale, 4 * scale);
  }

  static drawTreeMini(gfx, x, y, scale = 1) {
    gfx.fillStyle(0x8b5a2b, 1);
    gfx.fillRect(x - 6 * scale, y + 10 * scale, 12 * scale, 40 * scale);
    gfx.fillStyle(0x27ae60, 1);
    gfx.fillCircle(x, y - 4 * scale, 28 * scale);
    gfx.fillStyle(0x2ecc71, 1);
    gfx.fillCircle(x - 12 * scale, y + 4 * scale, 20 * scale);
    gfx.fillCircle(x + 12 * scale, y + 4 * scale, 20 * scale);
  }

  // ==========================================
  // DIRECTIONS RENDERING
  // ==========================================
  static renderDirectionScene(gfx, spec, width, height) {
    const { type, direction, goal } = spec;
    const midX = width / 2;
    const midY = height / 2;

    if (direction === 'left' || direction === 'turn_left') {
      this.drawDirectionArrow(gfx, width - 35, midY, 35, midY, 0x00cec9);
      this.drawGoalIcon(gfx, 24, midY, 'star');
    } else if (direction === 'right' || direction === 'turn_right') {
      this.drawDirectionArrow(gfx, 35, midY, width - 35, midY, 0x00cec9);
      this.drawGoalIcon(gfx, width - 24, midY, 'treasure');
    } else if (direction === 'up' || direction === 'straight') {
      this.drawDirectionArrow(gfx, midX, height - 25, midX, 25, 0x2ed573);
      this.drawGoalIcon(gfx, midX, 18, 'star');
    } else if (direction === 'down') {
      this.drawDirectionArrow(gfx, midX, 25, midX, height - 25, 0xe17055);
      this.drawGoalIcon(gfx, midX, height - 18, 'ground');
    }
  }

  static drawDirectionArrow(gfx, x1, y1, x2, y2, color) {
    gfx.lineStyle(6, color, 1);
    gfx.lineBetween(x1, y1, x2, y2);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 14;
    const p1X = x2 - headLen * Math.cos(angle - Math.PI / 6);
    const p1Y = y2 - headLen * Math.sin(angle - Math.PI / 6);
    const p2X = x2 - headLen * Math.cos(angle + Math.PI / 6);
    const p2Y = y2 - headLen * Math.sin(angle + Math.PI / 6);
    gfx.fillStyle(color, 1);
    gfx.fillTriangle(x2, y2, p1X, p1Y, p2X, p2Y);
  }

  static drawGoalIcon(gfx, x, y, goal) {
    if (goal === 'star') {
      gfx.fillStyle(0xf1c40f, 1);
      gfx.lineStyle(2, 0xf39c12, 1);
      const points = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 14 : 6;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        points.push(x + r * Math.cos(a), y + r * Math.sin(a));
      }
      gfx.fillPoints(points, true);
      gfx.strokePoints(points, true);
    } else {
      gfx.fillStyle(0xd35400, 1);
      gfx.fillRoundedRect(x - 12, y - 8, 24, 16, 4);
      gfx.fillStyle(0xf1c40f, 1);
      gfx.fillRoundedRect(x - 14, y - 12, 28, 8, 3);
    }
  }
}
