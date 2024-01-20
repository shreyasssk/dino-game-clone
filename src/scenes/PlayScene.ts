import { SpriteWithDynamicBody } from "../types";
import { Player } from "../entities/Player";
import GameScene from "./GameScene";
import { PRELOAD_CONFIG } from "..";

class PlayScene extends GameScene {
    
    player: Player;
    ground: Phaser.GameObjects.TileSprite;
    obstacles: Phaser.Physics.Arcade.Group;
    startTrigger: SpriteWithDynamicBody;

    spawnInterval: number = 1500;
    spawnTime: number = 0;
    gameSpeed: number = 5;
    
    constructor() {
        super("PlayScene");
    }

    create() {
        this.createEnvironment();
        this.createPlayer();

        this.obstacles = this.physics.add.group();

        this.startTrigger = this.physics.add.sprite(0, 10,  null)
            .setAlpha(0)
            .setOrigin(0, 1);

        // add a collide listener to player & obstacle
        this.physics.add.collider(this.obstacles, this.player, () => {
            this.isGameRunning = false;
            this.physics.pause();

            this.player.die();
        });

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

    spawnObstacle() {
        // because the key name ends in num (1-6)
        const obstacleNum = Math.floor(Math.random() * PRELOAD_CONFIG.cactusesCount) + 1;
        // width is 1000px, so get horizontal dist b/w 600-900
        const distance = Phaser.Math.Between(600, 900);

        this.obstacles.create(
            distance, 
            this.gameHeight, 
            `obstacle-${obstacleNum}`
        )
        .setOrigin(0, 1)
        .setImmovable();

    };
};

export default PlayScene;