import java.awt.*;
import java.awt.event.*;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Random;
import javax.swing.*;

public class Main extends JPanel
        implements KeyListener, MouseMotionListener {

    // =========================================================
    // WINDOW
    // =========================================================

    static final int WIDTH = 900;
    static final int HEIGHT = 700;

    // =========================================================
    // ROAD
    // =========================================================

    final int ROAD_LEFT = 190;
    final int ROAD_RIGHT = 710;
    final int ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT;

    // =========================================================
    // PLAYER
    // =========================================================

    double playerX = WIDTH / 2.0 - 30;
    double playerY = HEIGHT - 160;

    final int PLAYER_WIDTH = 60;
    final int PLAYER_HEIGHT = 110;

    final double KEY_MOVE_SPEED = 8.5;
    final double KEY_VERTICAL_SPEED = 6.5;

    final double MOUSE_SMOOTHNESS = 0.15;

    // =========================================================
    // MOUSE
    // =========================================================

    int mouseX = WIDTH / 2;
    int mouseY = HEIGHT - 160;

    boolean mouseControl = false;

    // =========================================================
    // NITRO
    // =========================================================

    double nitro = 100;

    final double MAX_NITRO = 100;

    // Strong Nitro movement
    final double NITRO_POWER = 8.0;

    // Nitro consumption
    final double NITRO_CONSUMPTION = 0.32;

    // Nitro recharge
    final double NITRO_RECHARGE = 0.12;

    boolean nitroActive = false;

    int nitroEffectTimer = 0;

    // =========================================================
    // GAME STATE
    // =========================================================

    boolean gameStarted = false;
    boolean gameOver = false;
    boolean paused = false;

    int score = 0;
    int highScore = 0;
    int lives = 3;

    int frame = 0;

    // =========================================================
    // SPEED
    // =========================================================

    double currentSpeed = 0;

    // =========================================================
    // ENVIRONMENT
    // =========================================================

    boolean nightMode = false;
    boolean rainMode = false;

    double roadOffset = 0;

    int invincibleTimer = 0;
    int collisionFlash = 0;

    // =========================================================
    // KEY STATES
    // =========================================================

    boolean leftPressed = false;
    boolean rightPressed = false;
    boolean upPressed = false;
    boolean downPressed = false;
    boolean nitroPressed = false;

    // =========================================================
    // OBJECTS
    // =========================================================

    ArrayList<EnemyCar> enemies =
            new ArrayList<>();

    ArrayList<Tree> trees =
            new ArrayList<>();

    ArrayList<RainDrop> rainDrops =
            new ArrayList<>();

    Random random = new Random();

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public Main() {

        setPreferredSize(
                new Dimension(WIDTH, HEIGHT)
        );

        setFocusable(true);

        addKeyListener(this);

        addMouseMotionListener(this);

        createTrees();

        createRain();
    }

    // =========================================================
    // START GAME
    // =========================================================

    void startGame() {

        gameStarted = true;
        gameOver = false;
        paused = false;

        score = 0;
        lives = 3;
        frame = 0;

        playerX =
                WIDTH / 2.0 -
                PLAYER_WIDTH / 2.0;

        playerY =
                HEIGHT -
                PLAYER_HEIGHT -
                30;

        mouseX =
                (int) playerX +
                PLAYER_WIDTH / 2;

        mouseY =
                (int) playerY +
                PLAYER_HEIGHT / 2;

        nitro = MAX_NITRO;

        nitroActive = false;

        enemies.clear();

        invincibleTimer = 0;
        collisionFlash = 0;

        requestFocusInWindow();

        repaint();
    }

    // =========================================================
    // RESTART
    // =========================================================

    void restartGame() {

        startGame();
    }

    // =========================================================
    // PAUSE
    // =========================================================

    void togglePause() {

        if (!gameStarted &&
                !gameOver) {

            return;
        }

        if (gameOver) {

            return;
        }

        paused = !paused;

        repaint();
    }

    // =========================================================
    // DISPLAY SPEED
    // =========================================================

    double getDisplaySpeed() {

        // Starting speed
        double speed = 80;

        // Gradual increase with score
        speed += score * 1.4;

        // Normal maximum
        if (speed > 220) {

            speed = 220;
        }

        // Nitro boost
        if (nitroActive) {

            speed += 90;

            speed += nitro * 0.15;
        }

        return speed;
    }

    // =========================================================
    // ACTUAL ENEMY / ROAD SPEED
    // =========================================================

    double getEnemySpeed() {

        // Starting speed
        double speed = 4.0;

        // Gradual difficulty
        speed += score * 0.025;

        // Maximum normal speed
        if (speed > 7.0) {

            speed = 7.0;
        }

        // Nitro boost
        if (nitroActive) {

            speed += 3.5;
        }

        return speed;
    }

    // =========================================================
    // UPDATE GAME
    // =========================================================

    void updateGame() {

        if (!gameStarted ||
                gameOver ||
                paused) {

            repaint();

            return;
        }

        frame++;

        updatePlayer();

        updateEnemies();

        checkCollision();

        updateTrees();

        updateRain();

        updateRoad();

        if (invincibleTimer > 0) {

            invincibleTimer--;
        }

        if (collisionFlash > 0) {

            collisionFlash--;
        }

        repaint();
    }

    // =========================================================
    // PLAYER UPDATE
    // =========================================================

    void updatePlayer() {

        double moveX = 0;
        double moveY = 0;

        // -----------------------------------------------------
        // KEYBOARD CONTROL
        // -----------------------------------------------------

        if (leftPressed) {

            moveX -= KEY_MOVE_SPEED;
        }

        if (rightPressed) {

            moveX += KEY_MOVE_SPEED;
        }

        if (upPressed) {

            moveY -= KEY_VERTICAL_SPEED;
        }

        if (downPressed) {

            moveY += KEY_VERTICAL_SPEED;
        }

        playerX += moveX;
        playerY += moveY;

        // -----------------------------------------------------
        // MOUSE CONTROL
        // -----------------------------------------------------

        if (mouseControl) {

            double targetX =
                    mouseX -
                    PLAYER_WIDTH / 2.0;

            double targetY =
                    mouseY -
                    PLAYER_HEIGHT / 2.0;

            if (!leftPressed &&
                    !rightPressed) {

                playerX +=
                        (targetX - playerX) *
                        MOUSE_SMOOTHNESS;
            }

            if (!upPressed &&
                    !downPressed) {

                playerY +=
                        (targetY - playerY) *
                        MOUSE_SMOOTHNESS;
            }
        }

        // -----------------------------------------------------
        // NITRO
        // -----------------------------------------------------

        if (nitroPressed &&
                nitro > 0 &&
                !gameOver) {

            nitroActive = true;

            // Strong forward boost
            playerY -= NITRO_POWER;

            // Drain Nitro
            nitro -= NITRO_CONSUMPTION;

            // Flame animation
            nitroEffectTimer = 12;

            if (nitro < 0) {

                nitro = 0;
            }

        } else {

            nitroActive = false;

            // Recharge
            if (nitro < MAX_NITRO) {

                nitro += NITRO_RECHARGE;

                if (nitro > MAX_NITRO) {

                    nitro = MAX_NITRO;
                }
            }
        }

        // -----------------------------------------------------
        // NITRO EFFECT TIMER
        // -----------------------------------------------------

        if (nitroEffectTimer > 0) {

            nitroEffectTimer--;
        }

        // -----------------------------------------------------
        // ROAD BOUNDARIES
        // -----------------------------------------------------

        int minX =
                ROAD_LEFT + 20;

        int maxX =
                ROAD_RIGHT -
                PLAYER_WIDTH -
                20;

        if (playerX < minX) {

            playerX = minX;
        }

        if (playerX > maxX) {

            playerX = maxX;
        }

        // -----------------------------------------------------
        // VERTICAL BOUNDARIES
        // -----------------------------------------------------

        if (playerY < 100) {

            playerY = 100;
        }

        if (playerY >
                HEIGHT -
                PLAYER_HEIGHT -
                20) {

            playerY =
                    HEIGHT -
                    PLAYER_HEIGHT -
                    20;
        }
    }

    // =========================================================
    // CREATE ENEMY
    // =========================================================

    void createEnemy() {

        int laneWidth =
                ROAD_WIDTH / 4;

        int lane =
                random.nextInt(4);

        EnemyCar enemy =
                new EnemyCar();

        enemy.x =
                ROAD_LEFT +
                lane * laneWidth +
                laneWidth / 2.0 -
                27;

        enemy.y = -140;

        enemy.width = 54;
        enemy.height = 100;

        enemy.speed =
                getEnemySpeed() *
                (0.80 +
                        random.nextDouble() *
                        0.35);

        enemy.color =
                getRandomCarColor();

        enemies.add(enemy);
    }

    // =========================================================
    // RANDOM CAR COLOR
    // =========================================================

    Color getRandomCarColor() {

        Color[] colors = {

                new Color(230, 40, 40),

                new Color(40, 110, 240),

                new Color(0, 190, 90),

                new Color(255, 145, 20),

                new Color(150, 50, 190),

                new Color(235, 235, 235),

                new Color(0, 180, 200)
        };

        return colors[
                random.nextInt(
                        colors.length
                )
        ];
    }

    // =========================================================
    // UPDATE ENEMIES
    // =========================================================

    void updateEnemies() {

        Iterator<EnemyCar> iterator =
                enemies.iterator();

        while (iterator.hasNext()) {

            EnemyCar enemy =
                    iterator.next();

            enemy.y += enemy.speed;

            if (enemy.y >
                    HEIGHT + 150) {

                iterator.remove();

                score++;

                if (score > highScore) {

                    highScore = score;
                }
            }
        }

        // Spawn rate becomes faster
        // as score increases

        int spawnRate =
                Math.max(
                        30,
                        70 - score / 15
                );

        if (frame % spawnRate == 0 &&
                enemies.size() < 6) {

            createEnemy();
        }
    }

    // =========================================================
    // COLLISION
    // =========================================================

    void checkCollision() {

        if (invincibleTimer > 0) {

            return;
        }

        Rectangle playerRect =
                new Rectangle(
                        (int) playerX + 12,
                        (int) playerY + 12,
                        PLAYER_WIDTH - 24,
                        PLAYER_HEIGHT - 24
                );

        for (EnemyCar enemy :
                enemies) {

            Rectangle enemyRect =
                    new Rectangle(
                            (int) enemy.x + 12,
                            (int) enemy.y + 12,
                            enemy.width - 24,
                            enemy.height - 24
                    );

            if (playerRect.intersects(
                    enemyRect
            )) {

                hitPlayer();

                break;
            }
        }
    }

    // =========================================================
    // PLAYER HIT
    // =========================================================

    void hitPlayer() {

        lives--;

        collisionFlash = 20;

        invincibleTimer = 120;

        nitro =
                Math.max(
                        0,
                        nitro - 20
                );

        if (lives <= 0) {

            endGame();
        }
    }

    // =========================================================
    // GAME OVER
    // =========================================================

    void endGame() {

        gameOver = true;

        gameStarted = false;

        nitroActive = false;

        repaint();
    }

    // =========================================================
    // TREES
    // =========================================================

    void createTrees() {

        trees.clear();

        for (int i = 0; i < 30; i++) {

            Tree tree =
                    new Tree();

            tree.leftSide =
                    random.nextBoolean();

            tree.y =
                    random.nextInt(
                            HEIGHT
                    );

            tree.size =
                    25 +
                    random.nextInt(30);

            trees.add(tree);
        }
    }

    // =========================================================
    // UPDATE TREES
    // =========================================================

    void updateTrees() {

        double speed =
                getEnemySpeed() *
                0.65;

        if (nitroActive) {

            speed *= 1.3;
        }

        for (Tree tree :
                trees) {

            tree.y += speed;

            if (tree.y >
                    HEIGHT + 70) {

                tree.y = -70;

                tree.leftSide =
                        random.nextBoolean();
            }
        }
    }

    // =========================================================
    // CREATE RAIN
    // =========================================================

    void createRain() {

        rainDrops.clear();

        for (int i = 0; i < 150; i++) {

            RainDrop drop =
                    new RainDrop();

            drop.x =
                    random.nextInt(
                            WIDTH
                    );

            drop.y =
                    random.nextInt(
                            HEIGHT
                    );

            drop.length =
                    8 +
                    random.nextInt(12);

            drop.speed =
                    5 +
                    random.nextDouble() * 5;

            rainDrops.add(drop);
        }
    }

    // =========================================================
    // UPDATE RAIN
    // =========================================================

    void updateRain() {

        for (RainDrop drop :
                rainDrops) {

            drop.y += drop.speed;

            drop.x -= 1;

            if (drop.y > HEIGHT) {

                drop.y = -20;

                drop.x =
                        random.nextInt(
                                WIDTH
                        );
            }
        }
    }

    // =========================================================
    // ROAD
    // =========================================================

    void updateRoad() {

        double roadSpeed =
                getEnemySpeed();

        if (nitroActive) {

            roadSpeed *= 1.35;
        }

        roadOffset += roadSpeed;

        if (roadOffset > 80) {

            roadOffset = 0;
        }
    }

    // =========================================================
    // PAINT
    // =========================================================

    @Override
    protected void paintComponent(
            Graphics g
    ) {

        super.paintComponent(g);

        Graphics2D g2 =
                (Graphics2D) g.create();

        g2.setRenderingHint(
                RenderingHints.KEY_ANTIALIASING,
                RenderingHints.VALUE_ANTIALIAS_ON
        );

        drawGame(g2);

        g2.dispose();
    }

    // =========================================================
    // DRAW GAME
    // =========================================================

    void drawGame(
            Graphics2D g
    ) {

        drawBackground(g);

        drawRoad(g);

        drawTrees(g);

        for (EnemyCar enemy :
                enemies) {

            drawCar(
                    g,
                    enemy.x,
                    enemy.y,
                    enemy.width,
                    enemy.height,
                    enemy.color,
                    false
            );
        }

        if (
                invincibleTimer == 0 ||
                (invincibleTimer / 5) % 2 == 0
        ) {

            drawCar(
                    g,
                    playerX,
                    playerY,
                    PLAYER_WIDTH,
                    PLAYER_HEIGHT,
                    new Color(
                            0,
                            160,
                            255
                    ),
                    true
            );
        }

        drawRain(g);

        drawHUD(g);

        if (!gameStarted &&
                !gameOver) {

            drawStartScreen(g);
        }

        if (paused) {

            drawPauseScreen(g);
        }

        if (gameOver) {

            drawGameOverScreen(g);
        }

        if (collisionFlash > 0) {

            g.setColor(
                    new Color(
                            255,
                            0,
                            0,
                            70
                    )
            );

            g.fillRect(
                    0,
                    0,
                    WIDTH,
                    HEIGHT
            );
        }
    }

    // =========================================================
    // BACKGROUND
    // =========================================================

    void drawBackground(
            Graphics2D g
    ) {

        if (nightMode) {

            g.setColor(
                    new Color(
                            10,
                            25,
                            50
                    )
            );

        } else {

            g.setColor(
                    new Color(
                            70,
                            180,
                            90
                    )
            );
        }

        g.fillRect(
                0,
                0,
                WIDTH,
                HEIGHT
        );

        g.setColor(
                nightMode
                        ? new Color(
                                20,
                                55,
                                30
                        )
                        : new Color(
                                80,
                                175,
                                75
                        )
        );

        g.fillRect(
                0,
                0,
                ROAD_LEFT,
                HEIGHT
        );

        g.fillRect(
                ROAD_RIGHT,
                0,
                WIDTH - ROAD_RIGHT,
                HEIGHT
        );
    }

    // =========================================================
    // ROAD
    // =========================================================

    void drawRoad(
            Graphics2D g
    ) {

        g.setColor(
                new Color(
                        50,
                        50,
                        53
                )
        );

        g.fillRect(
                ROAD_LEFT,
                0,
                ROAD_WIDTH,
                HEIGHT
        );

        // Road edges

        g.setColor(Color.WHITE);

        g.fillRect(
                ROAD_LEFT,
                0,
                7,
                HEIGHT
        );

        g.fillRect(
                ROAD_RIGHT - 7,
                0,
                7,
                HEIGHT
        );

        // Lane markings

        int laneWidth =
                ROAD_WIDTH / 4;

        g.setColor(
                Color.LIGHT_GRAY
        );

        for (int lane = 1;
             lane < 4;
             lane++) {

            int x =
                    ROAD_LEFT +
                    lane * laneWidth;

            for (
                    int y =
                            (int)
                                    (-80 +
                                            roadOffset);
                    y < HEIGHT;
                    y += 80
            ) {

                g.fillRect(
                        x - 3,
                        y,
                        6,
                        40
                );
            }
        }
    }

    // =========================================================
    // TREES
    // =========================================================

    void drawTrees(
            Graphics2D g
    ) {

        for (Tree tree :
                trees) {

            int x;

            if (tree.leftSide) {

                x =
                        ROAD_LEFT -
                        50 -
                        tree.size;

            } else {

                x =
                        ROAD_RIGHT + 50;
            }

            // Tree trunk

            g.setColor(
                    new Color(
                            100,
                            65,
                            30
                    )
            );

            g.fillRect(
                    x +
                            tree.size / 2 -
                            5,
                    (int) tree.y +
                            tree.size / 2,
                    10,
                    tree.size
            );

            // Leaves

            g.setColor(
                    nightMode
                            ? new Color(
                                    20,
                                    80,
                                    35
                            )
                            : new Color(
                                    10,
                                    125,
                                    35
                            )
            );

            g.fillOval(
                    x,
                    (int) tree.y,
                    tree.size,
                    tree.size
            );
        }
    }

    // =========================================================
    // DRAW CAR
    // =========================================================

    void drawCar(
            Graphics2D g,
            double x,
            double y,
            int width,
            int height,
            Color color,
            boolean player
    ) {

        int ix = (int) x;
        int iy = (int) y;

        // Shadow

        g.setColor(
                new Color(
                        0,
                        0,
                        0,
                        90
                )
        );

        g.fillRoundRect(
                ix + 5,
                iy + 8,
                width,
                height,
                15,
                15
        );

        // Main body

        g.setColor(color);

        g.fillRoundRect(
                ix,
                iy,
                width,
                height,
                15,
                15
        );

        // Windows

        g.setColor(
                new Color(
                        20,
                        45,
                        60
                )
        );

        g.fillRoundRect(
                ix + width / 4,
                iy + 22,
                width / 2,
                25,
                8,
                8
        );

        // Front windshield

        g.setColor(
                new Color(
                        50,
                        100,
                        120
                )
        );

        g.fillRoundRect(
                ix + width / 4,
                iy + 50,
                width / 2,
                15,
                5,
                5
        );

        // Headlights

        g.setColor(
                new Color(
                        255,
                        255,
                        210
                )
        );

        g.fillRect(
                ix + 8,
                iy + height - 25,
                12,
                10
        );

        g.fillRect(
                ix + width - 20,
                iy + height - 25,
                12,
                10
        );

        // Rear lights

        g.setColor(Color.RED);

        g.fillRect(
                ix + 8,
                iy + 10,
                10,
                8
        );

        g.fillRect(
                ix + width - 18,
                iy + 10,
                10,
                8
        );

        // Wheels

        g.setColor(
                new Color(
                        15,
                        15,
                        15
                )
        );

        g.fillRoundRect(
                ix - 5,
                iy + 20,
                8,
                25,
                4,
                4
        );

        g.fillRoundRect(
                ix + width - 3,
                iy + 20,
                8,
                25,
                4,
                4
        );

        g.fillRoundRect(
                ix - 5,
                iy + height - 45,
                8,
                25,
                4,
                4
        );

        g.fillRoundRect(
                ix + width - 3,
                iy + height - 45,
                8,
                25,
                4,
                4
        );

        // =====================================================
        // NITRO FLAME
        // =====================================================

        if (player &&
                nitroActive) {

            int flameLength =
                    35 +
                    random.nextInt(30);

            // Outer flame

            int[] outerX = {

                    ix + width / 4,
                    ix + width / 2,
                    ix + width * 3 / 4

            };

            int[] outerY = {

                    iy + height - 5,
                    iy + height + flameLength,
                    iy + height - 5

            };

            g.setColor(
                    new Color(
                            255,
                            100,
                            0
                    )
            );

            g.fillPolygon(
                    outerX,
                    outerY,
                    3
            );

            // Middle flame

            int innerLength =
                    flameLength - 12;

            int[] innerX = {

                    ix + width / 3,
                    ix + width / 2,
                    ix + width * 2 / 3

            };

            int[] innerY = {

                    iy + height - 5,
                    iy + height + innerLength,
                    iy + height - 5

            };

            g.setColor(
                    new Color(
                            255,
                            220,
                            40
                    )
            );

            g.fillPolygon(
                    innerX,
                    innerY,
                    3
            );

            // White hot center

            int[] centerX = {

                    ix + width * 2 / 5,
                    ix + width / 2,
                    ix + width * 3 / 5

            };

            int[] centerY = {

                    iy + height,
                    iy + height + 20,
                    iy + height

            };

            g.setColor(Color.WHITE);

            g.fillPolygon(
                    centerX,
                    centerY,
                    3
            );
        }
    }

    // =========================================================
    // RAIN
    // =========================================================

    void drawRain(
            Graphics2D g
    ) {

        if (!rainMode) {

            return;
        }

        g.setColor(
                new Color(
                        190,
                        220,
                        255,
                        150
                )
        );

        for (RainDrop drop :
                rainDrops) {

            g.drawLine(
                    (int) drop.x,
                    (int) drop.y,
                    (int) drop.x - 4,
                    (int) drop.y +
                            drop.length
            );
        }
    }

    // =========================================================
    // HUD
    // =========================================================

    void drawHUD(
            Graphics2D g
    ) {

        // HUD background

        g.setColor(
                new Color(
                        0,
                        0,
                        0,
                        180
                )
        );

        g.fillRoundRect(
                15,
                15,
                600,
                115,
                12,
                12
        );

        // =====================================================
        // BASIC INFORMATION
        // =====================================================

        g.setFont(
                new Font(
                        "Arial",
                        Font.BOLD,
                        16
                )
        );

        g.setColor(Color.WHITE);

        g.drawString(
                "Lives: " + lives,
                30,
                40
        );

        g.drawString(
                "Score: " + score,
                120,
                40
        );

        g.drawString(
                "High: " + highScore,
                230,
                40
        );

        // =====================================================
        // SPEED
        // =====================================================

        currentSpeed =
                getDisplaySpeed();

        g.setFont(
                new Font(
                        "Arial",
                        Font.BOLD,
                        20
                )
        );

        g.setColor(Color.WHITE);

        g.drawString(
                String.format(
                        "SPEED: %.0f km/h",
                        currentSpeed
                ),
                350,
                40
        );

        // =====================================================
        // SPEED BAR
        // =====================================================

        int speedBarWidth = 200;

        g.setColor(
                new Color(
                        60,
                        60,
                        60
                )
        );

        g.fillRoundRect(
                30,
                55,
                speedBarWidth,
                15,
                7,
                7
        );

        double speedPercent =
                Math.min(
                        currentSpeed / 350.0,
                        1.0
                );

        g.setColor(
                new Color(
                        0,
                        210,
                        255
                )
        );

        g.fillRoundRect(
                30,
                55,
                (int)
                        (speedBarWidth *
                                speedPercent),
                15,
                7,
                7
        );

        // =====================================================
        // NITRO
        // =====================================================

        g.setColor(Color.WHITE);

        g.setFont(
                new Font(
                        "Arial",
                        Font.BOLD,
                        16
                )
        );

        g.drawString(
                "NITRO",
                30,
                95
        );

        g.setColor(
                new Color(
                        60,
                        60,
                        60
                )
        );

        g.fillRoundRect(
                90,
                82,
                180,
                15,
                7,
                7
        );

        g.setColor(
                new Color(
                        255,
                        150,
                        20
                )
        );

        g.fillRoundRect(
                90,
                82,
                (int)
                        (180 *
                                nitro /
                                100),
                15,
                7,
                7
        );

        // =====================================================
        // DAY / NIGHT
        // =====================================================

        g.setColor(Color.WHITE);

        g.drawString(
                nightMode
                        ? "NIGHT"
                        : "DAY",
                300,
                95
        );

        if (rainMode) {

            g.drawString(
                    "RAIN",
                    380,
                    95
            );
        }

        // =====================================================
        // BOOST
        // =====================================================

        if (nitroActive) {

            g.setFont(
                    new Font(
                            "Arial",
                            Font.BOLD,
                            26
                    )
            );

            g.setColor(
                    new Color(
                            255,
                            180,
                            20
                    )
            );

            g.drawString(
                    "BOOST!",
                    470,
                    98
            );
        }
    }

    // =========================================================
    // START SCREEN
    // =========================================================

    void drawStartScreen(
            Graphics2D g
    ) {

        drawOverlay(g);

        drawPanel(
                g,
                "CAR RACING",
                "Press ENTER to start"
        );

        g.setColor(Color.WHITE);

        g.setFont(
                new Font(
                        "Arial",
                        Font.PLAIN,
                        16
                )
        );

        g.drawString(
                "Mouse = Move Car",
                350,
                380
        );

        g.drawString(
                "Arrow Keys / WASD = Move Car",
                305,
                410
        );

        g.drawString(
                "SPACE = Nitro Boost",
                350,
                440
        );

        g.drawString(
                "P = Pause",
                370,
                470
        );

        g.drawString(
                "N = Day / Night",
                345,
                500
        );

        g.drawString(
                "M = Rain",
                370,
                530
        );
    }

    // =========================================================
    // PAUSE SCREEN
    // =========================================================

    void drawPauseScreen(
            Graphics2D g
    ) {

        drawOverlay(g);

        drawPanel(
                g,
                "GAME PAUSED",
                "Press P to continue"
        );
    }

    // =========================================================
    // GAME OVER
    // =========================================================

    void drawGameOverScreen(
            Graphics2D g
    ) {

        drawOverlay(g);

        drawPanel(
                g,
                "GAME OVER",
                "Press R or ENTER to restart"
        );

        g.setColor(Color.WHITE);

        g.setFont(
                new Font(
                        "Arial",
                        Font.BOLD,
                        22
                )
        );

        g.drawString(
                "Score: " + score,
                390,
                400
        );

        g.drawString(
                "High Score: " + highScore,
                365,
                440
        );
    }

    // =========================================================
    // OVERLAY
    // =========================================================

    void drawOverlay(
            Graphics2D g
    ) {

        g.setColor(
                new Color(
                        0,
                        0,
                        0,
                        175
                )
        );

        g.fillRect(
                0,
                0,
                WIDTH,
                HEIGHT
        );
    }

    // =========================================================
    // PANEL
    // =========================================================

    void drawPanel(
            Graphics2D g,
            String title,
            String subtitle
    ) {

        int panelX = 200;
        int panelY = 180;
        int panelW = 500;
        int panelH = 390;

        g.setColor(
                new Color(
                        10,
                        20,
                        35,
                        245
                )
        );

        g.fillRoundRect(
                panelX,
                panelY,
                panelW,
                panelH,
                25,
                25
        );

        g.setColor(
                new Color(
                        0,
                        220,
                        255
                )
        );

        g.setStroke(
                new BasicStroke(3)
        );

        g.drawRoundRect(
                panelX,
                panelY,
                panelW,
                panelH,
                25,
                25
        );

        g.setFont(
                new Font(
                        "Arial",
                        Font.BOLD,
                        38
                )
        );

        FontMetrics fm =
                g.getFontMetrics();

        g.drawString(
                title,
                WIDTH / 2 -
                        fm.stringWidth(title) / 2,
                280
        );

        g.setFont(
                new Font(
                        "Arial",
                        Font.PLAIN,
                        17
                )
        );

        fm =
                g.getFontMetrics();

        g.drawString(
                subtitle,
                WIDTH / 2 -
                        fm.stringWidth(subtitle) / 2,
                325
        );
    }

    // =========================================================
    // KEY PRESSED
    // =========================================================

    @Override
    public void keyPressed(
            KeyEvent e
    ) {

        int key =
                e.getKeyCode();

        // -----------------------------------------------------
        // START
        // -----------------------------------------------------

        if (key ==
                KeyEvent.VK_ENTER) {

            if (!gameStarted &&
                    !gameOver) {

                startGame();

                return;
            }

            if (gameOver) {

                restartGame();

                return;
            }

            if (paused) {

                togglePause();

                return;
            }
        }

        // -----------------------------------------------------
        // RESTART
        // -----------------------------------------------------

        if (key ==
                KeyEvent.VK_R &&
                gameOver) {

            restartGame();

            return;
        }

        // -----------------------------------------------------
        // PAUSE
        // -----------------------------------------------------

        if (key ==
                KeyEvent.VK_P) {

            togglePause();

            return;
        }

        // -----------------------------------------------------
        // DAY / NIGHT
        // -----------------------------------------------------

        if (key ==
                KeyEvent.VK_N) {

            nightMode =
                    !nightMode;

            repaint();

            return;
        }

        // -----------------------------------------------------
        // RAIN
        // -----------------------------------------------------

        if (key ==
                KeyEvent.VK_M) {

            rainMode =
                    !rainMode;

            repaint();

            return;
        }

        if (!gameStarted ||
                paused) {

            return;
        }

        // -----------------------------------------------------
        // MOVEMENT
        // -----------------------------------------------------

        switch (key) {

            case KeyEvent.VK_LEFT:
            case KeyEvent.VK_A:

                leftPressed = true;

                break;

            case KeyEvent.VK_RIGHT:
            case KeyEvent.VK_D:

                rightPressed = true;

                break;

            case KeyEvent.VK_UP:
            case KeyEvent.VK_W:

                upPressed = true;

                break;

            case KeyEvent.VK_DOWN:
            case KeyEvent.VK_S:

                downPressed = true;

                break;

            case KeyEvent.VK_SPACE:

                nitroPressed = true;

                break;
        }
    }

    // =========================================================
    // KEY RELEASED
    // =========================================================

    @Override
    public void keyReleased(
            KeyEvent e
    ) {

        int key =
                e.getKeyCode();

        switch (key) {

            case KeyEvent.VK_LEFT:
            case KeyEvent.VK_A:

                leftPressed = false;

                break;

            case KeyEvent.VK_RIGHT:
            case KeyEvent.VK_D:

                rightPressed = false;

                break;

            case KeyEvent.VK_UP:
            case KeyEvent.VK_W:

                upPressed = false;

                break;

            case KeyEvent.VK_DOWN:
            case KeyEvent.VK_S:

                downPressed = false;

                break;

            case KeyEvent.VK_SPACE:

                nitroPressed = false;

                break;
        }
    }

    @Override
    public void keyTyped(
            KeyEvent e
    ) {
    }

    // =========================================================
    // MOUSE MOVEMENT
    // =========================================================

    @Override
    public void mouseMoved(
            MouseEvent e
    ) {

        mouseX =
                e.getX();

        mouseY =
                e.getY();

        mouseControl = true;
    }

    // =========================================================
    // MOUSE DRAGGED
    // =========================================================

    @Override
    public void mouseDragged(
            MouseEvent e
    ) {

        mouseX =
                e.getX();

        mouseY =
                e.getY();

        mouseControl = true;
    }

    // =========================================================
    // ENEMY CLASS
    // =========================================================

    class EnemyCar {

        double x;
        double y;

        int width;
        int height;

        double speed;

        Color color;
    }

    // =========================================================
    // TREE CLASS
    // =========================================================

    class Tree {

        boolean leftSide;

        double y;

        int size;
    }

    // =========================================================
    // RAIN CLASS
    // =========================================================

    class RainDrop {

        double x;
        double y;

        int length;

        double speed;
    }

    // =========================================================
    // MAIN
    // =========================================================

    public static void main(
            String[] args
    ) {

        SwingUtilities.invokeLater(
                () -> {

                    JFrame frame =
                            new JFrame(
                                    "Ultimate Car Racing"
                            );

                    Main game =
                            new Main();

                    frame.setDefaultCloseOperation(
                            JFrame.EXIT_ON_CLOSE
                    );

                    frame.setResizable(false);

                    frame.add(game);

                    frame.pack();

                    frame.setLocationRelativeTo(
                            null
                    );

                    frame.setVisible(true);

                    game.requestFocusInWindow();

                    Timer timer =
                            new Timer(
                                    16,
                                    e ->
                                            game.updateGame()
                            );

                    timer.start();
                }
        );
    }
}