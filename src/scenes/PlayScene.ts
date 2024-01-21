import { SpriteWithDynamicBody } from "../types";
import { Player } from "../entities/Player";
import GameScene from "./GameScene";
import { PRELOAD_CONFIG } from "..";

class PlayScene extends GameScene {
    player: Player;
    ground: Phaser.GameObjects.TileSprite;
    obstacles: Phaser.Physics.Arcade.Group;
    startTrigger: SpriteWithDynamicBody;

    gameOverContainer: Phaser.GameObjects.Container;
    gameOverText: Phaser.GameObjects.Image;
    restartText: Phaser.GameObjects.Image;

    spawnInterval: number = 1500;
    spawnTime: number = 0;
    gameSpeed: number = 5;
    
    constructor() {
        super("PlayScene");
    }

    create() {
        this.createEnvironment();
        this.createPlayer();
        this.createObstacles();
        this.createGameoverContainer();
        this.createAnimations();

        this.handleGameStart();
        this.handleObstacleCollisions();
        this.handleGameRestart();
    };

    update(time: number, delta: number): void {
        if (!this.isGameRunning) { return; }

        this.spawnTime += delta;

        if (this.spawnTime > this.spawnInterval) {
            this.spawnObstacle();
            this.spawnTime = 0;
        };

        Phaser.Actions.IncX(this.obstacles.getChildren(), -this.gameSpeed);

        this.obstacles.getChildren().forEach((obstacle: SpriteWithDynamicBody) => {
            // when obstacle leaves the game area, destroy it
            if (obstacle.getBounds().right < 0) {
                this.obstacles.remove(obstacle);
            }
        });

        this.ground.tilePositionX += this.gameSpeed;
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
            this.gameSpeed = 5;
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