import GameScene from "../scenes/GameScene";

export class Player extends Phaser.Physics.Arcade.Sprite {

    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    scene: GameScene; // overriding constructing "scene"

    constructor(scene: GameScene, x: number, y: number) {
        super(scene, x, y, "dino-run");

        // to register `this` as Sprite Game Object
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.init();

        // to activate the `update()` of Player in main scene
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    }

    init() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this
            .setOrigin(0, 1)
            .setGravityY(5000) // bring the player down
            .setCollideWorldBounds(true) // don't allow it to go below the canvas height
            .setBodySize(44, 92);

        // this.registerPlayerControl();
        this.registerAnimations();
    };

    update() {
        const { space } = this.cursors;
        // to use space just once in a cycle
        const isSpaceJustDown = Phaser.Input.Keyboard.JustDown(space);

        const onFloor = (this.body as Phaser.Physics.Arcade.Body).onFloor();

        if (isSpaceJustDown && onFloor) {
            this.setVelocityY(-1600);
        };

        if (!this.scene.isGameRunning) { return };

        // stop run anims when in air (jump)
        if (this.body.deltaAbsY() > 0) {
            this.anims.stop();
            // freeze on specific frame (texture)
            this.setTexture("dino-run", 0);
        } else {
            this.playRunAnimation();
        };
    };

    // registerPlayerControl() {
    //     const spaceBar = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    //     spaceBar.on("down", () => {
    //         this.setVelocityY(-1600); // go up
    //     });
    // };

    playRunAnimation() {
        this.play("dino-run", true);
    }

    registerAnimations() {
        this.anims.create({
            key: "dino-run",
            frames: this.anims.generateFrameNames("dino-run", { start: 2, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
    };

    die() {
        this.anims.pause();
        this.setTexture("dino-hurt");
    }
};