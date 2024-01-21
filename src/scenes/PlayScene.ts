import { SpriteWithDynamicBody } from "../types";
import { Player } from "../entities/Player";
import GameScene from "./GameScene";
import { PRELOAD_CONFIG } from "..";

class PlayScene extends GameScene {
    player: Player;
    ground: Phaser.GameObjects.TileSprite;
    obstacles: Phaser.Physics.Arcade.Group;
    clouds: Phaser.GameObjects.Group;
    startTrigger: SpriteWithDynamicBody;

    scoreText: Phaser.GameObjects.Text;
    gameOverContainer: Phaser.GameObjects.Container;
    restartText: Phaser.GameObjects.Image;
    gameOverText: Phaser.GameObjects.Image;

    score: number = 0;
    scoreInterval: number = 100;
    scoreDeltaTime: number = 0;

    spawnInterval: number = 1500;
    spawnTime: number = 0;
    gameSpeed: number = 5;
    gameSpeedModifier: number = 1;
    
    constructor() {
        super("PlayScene");
    }

    create() {
        this.createEnvironment();
        this.createPlayer();
        this.createObstacles();
        this.createGameoverContainer();
        this.createAnimations();
        this.createScore();

        this.handleGameStart();
        this.handleObstacleCollisions();
        this.handleGameRestart();
    };

    update(time: number, delta: number): void {
        if (!this.isGameRunning) { return; }

        this.spawnTime += delta;
        this.scoreDeltaTime += delta;

        if (this.scoreDeltaTime >= this.scoreInterval) {
            this.score++;
            this.scoreDeltaTime = 0;

            // every 100 score increase difficulty level
            if (this.score % 100 === 0) {
                this.gameSpeedModifier++;
                // this.gameSpeedModifier += 0.2;
            }
        }

        if (this.spawnTime > this.spawnInterval) {
            this.spawnObstacle();
            this.spawnTime = 0;
        };

        Phaser.Actions.IncX(this.obstacles.getChildren(), -this.gameSpeed * this.gameSpeedModifier);
        Phaser.Actions.IncX(this.clouds.getChildren(), -0.5);

        // change score text
        const score = Array.from(String(this.score), Number);

        for (let i = 0; i < 5 - String(this.score).length; i++) {
            score.unshift(0);
        }
        this.scoreText.setText(score.join(""));

        this.obstacles.getChildren().forEach((obstacle: SpriteWithDynamicBody) => {
            // when obstacle leaves the game area, destroy it
            if (obstacle.getBounds().right < 0) {
                this.obstacles.remove(obstacle);
            }
        });

        this.clouds.getChildren().forEach((cloud: SpriteWithDynamicBody) => {
            // when obstacle leaves the game area, destroy it
            if (cloud.getBounds().right < 0) {
                // spawn again 30px after gameWidth
                cloud.x = this.gameWidth + 30;
            }
        });

        this.ground.tilePositionX += (this.gameSpeed * this.gameSpeedModifier);
    }
    
    createPlayer() {
        // this.player = this.physics.add
        //     .sprite(0, this.gameHeight,  "dino-idle")
        //     .setOrigin(0, 1);

        // this.player
        //     .setGravityY(5000) // bring the player down
        //     .setCollideWorldBounds(true) // don't allow it to go below the canvas height
        //     .setBodySize(44, 92);

        this.player = new Player(this, 0, this.gameHeight);
    };

    createEnvironment() {
        this.ground = this.add
            .tileSprite(0, this.gameHeight, 88, 26, "ground")
            .setOrigin(0, 1);

        this.clouds = this.add.group();

        this.clouds = this.clouds.addMultiple([
            this.add.image(this.gameWidth / 2, 170, "cloud"),
            this.add.image(this.gameWidth -80, 80, "cloud"),
            this.add.image(this.gameWidth / 1.3, 100, "cloud"),
        ]);

        this.clouds.setAlpha(0);
    };

    createObstacles() {
        this.gameOverText = this.add.image(0, 0, "game-over");
        this.restartText = this.add.image(0, 80, "restart").setInteractive();

        this.gameOverContainer = this.add
            .container(this.gameWidth / 2, (this.gameHeight / 2) - 50)
            .add([this.gameOverText, this.restartText])
            .setAlpha(0); // hide container
    };

    createGameoverContainer() {
        this.obstacles = this.physics.add.group();
    };

    createAnimations() {
        this.anims.create({
            key: "enemy-bird-fly",
            frames: this.anims.generateFrameNumbers("enemy-bird"),
            frameRate: 6,
            repeat: -1
        });
    };

    createScore() {
        this.scoreText = this.add
        .text(this.gameWidth, 0, "00000", {
            fontSize: 30,
            fontFamily: "Arial",
            color: "#535353",
            resolution: 5,
        })
        .setOrigin(1, 0)
        .setAlpha(0);
    };

    spawnObstacle() {
        const obstaclesCount = PRELOAD_CONFIG.cactusesCount + PRELOAD_CONFIG.birdsCount;
        // because the key name ends in num (1-7)
        const obstacleNum = Math.floor(Math.random() * obstaclesCount) + 1;
        // const obstacleNum = 7;
        
        // width is 1000px, so get horizontal dist b/w 600-900
        const distance = Phaser.Math.Between(150, 300);
        let obstacle;

        if (obstacleNum > PRELOAD_CONFIG.cactusesCount) {
            const enemyPossibleHeight = [20, 70];
            const enemyHeight = enemyPossibleHeight[Math.floor(Math.random() * 2)];

            obstacle = this.obstacles.create(
                this.gameWidth + distance, 
                this.gameHeight - enemyHeight, 
                "enemy-bird"
            );
            obstacle.play("enemy-bird-fly", true);
        } else {
            obstacle = this.obstacles.create(
                this.gameWidth + distance, 
                this.gameHeight, 
                `obstacle-${obstacleNum}`
            );
        }

        obstacle
            .setOrigin(0, 1)
            .setImmovable();

    };

    handleGameStart() {
        this.startTrigger = this.physics.add.sprite(0, 10,  null)
            .setAlpha(0)
            .setOrigin(0, 1);

        // when the dinasor touchs the trigger
        this.physics.add.overlap(this.startTrigger, this.player, () => {

            // trigger upper trigger, push the trigger to ground
            if (this.startTrigger.y === 10) {
                this.startTrigger.body.reset(0, this.gameHeight);
                return;
            };

            // remove the trigger from scene
            this.startTrigger.body.reset(9999, 9999);

            // roll out the ground
            const rollOutEvent = this.time.addEvent({
                delay: 1000 / 60,
                loop: true,
                callback: () => {
                    // push the player a bit
                    this.player.setVelocityX(80);

                    // play run animation
                    this.player.playRunAnimation();

                    this.ground.width += (17 * 2);

                    if (this.ground.width >= this.gameWidth) {
                        // remove the timer
                        rollOutEvent.remove();
                        
                        // stop moving the player
                        this.player.setVelocityX(0);

                        // show clouds in the scene
                        this.clouds.setAlpha(1);

                        // show score text
                        this.scoreText.setAlpha(1);

                        // remove the additional ground width 
                        // and set it to game width
                        this.ground.width = this.gameWidth;

                        // flag game start
                        this.isGameRunning = true;
                    }
                },
            });
        });
    };

    handleObstacleCollisions() {
        // add a collide listener to player & obstacle
        this.physics.add.collider(this.obstacles, this.player, () => {
            this.isGameRunning = false;
            this.physics.pause();
            this.anims.pauseAll();

            this.player.die();
            this.gameOverContainer.setAlpha(1); // show container

            this.spawnTime = 0;
            this.score = 0;
            this.scoreDeltaTime = 0;

            // reset game difficulty
            this.gameSpeedModifier = 1;
        });
    };

    handleGameRestart() {
        this.restartText.on("pointerdown", () => {
            this.physics.resume();
            // to avoid the jump when game starts
            this.player.setVelocityY(0);

            // remove obstacles from scene and its children
            this.obstacles.clear(true, true);
            // remove the game-over text from scene
            this.gameOverContainer.setAlpha(0);

            // resume anims
            this.anims.resumeAll();

            this.isGameRunning = true;
        });
    };
};

export default PlayScene;