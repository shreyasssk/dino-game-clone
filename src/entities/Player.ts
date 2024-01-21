import GameScene from "../scenes/GameScene";

export class Player extends Phaser.Physics.Arcade.Sprite {

    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    scene: GameScene; // overriding constructing "scene"
    jumpSound: Phaser.Sound.HTML5AudioSound;
    hitSound: Phaser.Sound.HTML5AudioSound;

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
            .setBodySize(44, 92)
            .setOffset(20, 0)
            .setDepth(1); // like z-index, brings the player in front when coincide with other objects

        // this.registerPlayerControl();
        this.registerAnimations();
        this.registerSounds();
    };

    update() {
        const { space, down } = this.cursors;

        // returns true if spacebar is pressed and not released
        const isSpaceJustDown = Phaser.Input.Keyboard.JustDown(space);
        const isDownJustDown = Phaser.Input.Keyboard.JustDown(down);
        const isDownJustUp = Phaser.Input.Keyboard.JustUp(down);

        const onFloor = (this.body as Phaser.Physics.Arcade.Body).onFloor();

        if (isSpaceJustDown && onFloor) {
            this.setVelocityY(-1600);
            this.jumpSound.play();
        };

        if (isDownJustDown && onFloor) {
            // change collision border of player when it crouches
            this.body.setSize(this.body.width, 58);
            this.setOffset(60, 34);
        }
        // the down key is released
        if (isDownJustUp && onFloor) {
            // reset original position    
            this.body.setSize(44, 92);
            this.setOffset(20, 0);
        }

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
        this.body.height <= 58 ?
        this.play("dino-down", true) :
        this.play("dino-run", true);
    }

    registerAnimations() {
        this.anims.create({
            key: "dino-run",
            frames: this.anims.generateFrameNames("dino-run", { start: 2, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: "dino-down",
            frames: this.anims.generateFrameNames("dino-down"),
            frameRate: 10,
            repeat: -1
        });
    };

    registerSounds() {
        this.jumpSound = this.scene.sound.add("jump", { volume: 0.5 }) as Phaser.Sound.HTML5AudioSound;
        this.hitSound = this.scene.sound.add("hit", { volume: 0.5 }) as Phaser.Sound.HTML5AudioSound;
    };

    die() {
        this.anims.pause();
        this.setTexture("dino-hurt");
        this.hitSound.play();
    }
};