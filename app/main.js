
var map, layer, cursors, jumpButton, runButton, result, animate

const nanthy = {
    sprite: undefined,
    direction: 'right',
    doNothing: true,
    resetMe: _ => {
        nanthy.sprite.y = layer.position.y+320/10*9-nanthy.sprite.height/2
        nanthy.sprite.x = layer.position.x+32*2+nanthy.sprite.width/2
        nanthy.sprite.scale.x = Math.abs(nanthy.sprite.scale.x)
        nanthy.direction = "right"
        level.hasKey=false
    }
}, level = {}

level.preload = () => {
  game.load.tilemap('objects', '../marioPhaser/assets/Level-'+game.level+'.json', null, Phaser.Tilemap.TILED_JSON)
  game.load.image('tiles', '../marioPhaser/assets/items2.png')
  game.load.spritesheet('nanthy', '../marioPhaser/assets/marioSmall.png', 34, 34, 7)
  game.load.spritesheet('electricity', '../marioPhaser/assets/electricity.png', 32, 32)
  game.load.spritesheet('water', '../marioPhaser/assets/water.png', 32, 32)
  game.load.spritesheet('fire', '../marioPhaser/assets/fire.png', 32, 32)
}

level.create = () => {
    game.physics.startSystem(Phaser.Physics.ARCADE)
    game.stage.backgroundColor = '#000000'
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
    map = game.add.tilemap('objects')
    map.addTilesetImage('Assets', 'tiles')
    layer = map.createLayer('Level 1')
    layer.resizeWorld()
    map.setCollisionBetween(14, 16)
    map.setCollisionBetween(21, 22)
    map.setCollisionBetween(27, 28)
    //map.setCollisionByIndex(10)
    map.setCollisionByIndex(13)
    map.setCollisionByIndex(17)
    map.setCollisionByIndex(18)
    map.setCollisionByIndex(40)
    // All id's are incremented by 1
    map.setTileIndexCallback(19, level.gotKey, level);
    map.setTileIndexCallback(5, level.addValue(50), level);
    map.setTileIndexCallback(11, level.addValue(100), level);
    map.setTileIndexCallback(12, level.addValue(150), level);
    map.setTileIndexCallback(10, level.finishLevel, level);
    level.score = game.score
    animate = {};["fire","electricity","water"].forEach(i => {animate[i] = game.add.group()});
    Object.keys(animate).forEach(k => animate[k].enableBody = true);
    map.createFromObjects('fire', 2, 'fire', 0, true, false, animate.fire);
    map.createFromObjects('electricity', 41, 'electricity', 0, true, false, animate.electricity);
    map.createFromObjects('water', 35, 'water', 0, true, false, animate.water);
    level.initiateElementAnimations()

    nanthy.sprite = game.add.sprite(32, 32, 'nanthy')
    nanthy.sprite.scale.setTo(0.91, 0.91)
    nanthy.sprite.anchor.x=0.5
    nanthy.sprite.anchor.y=0.5
    nanthy.sprite.animations.add('walk')

    game.physics.enable(nanthy.sprite)
    game.physics.arcade.gravity.y = 700
    //nanthy.sprite.body.position
    nanthy.sprite.body.bounce.y = 0
    nanthy.sprite.body.width /= 3
    nanthy.sprite.body.offset.x=(nanthy.sprite.width-nanthy.sprite.body.width)/2
    nanthy.sprite.body.linearDamping = 1
    nanthy.sprite.body.collideWorldBounds = true

    //nanthy.sprite.body.acceleration.x = 120;

    nanthy.sprite.animations.add('left', [2,4,5], 10, true)
    nanthy.sprite.animations.add('wait', [0], 10, true)
    nanthy.sprite.animations.add('jump', [6], 10, true)

    nanthy.sprite.body.fixedRotation = true
    nanthy.resetMe()
    level.text = game.add.text(0,0, "Dangerous Nanthy",{font: "32px Raleway,Arial", fill: "#23b929"})
    //level.text.position.y = (50-level.text.height)/2
    //nanthy.sprite.body.onBeginContact.add(blockHit, this);

    game.camera.follow(nanthy.sprite)
    cursors = game.input.keyboard.createCursorKeys()
    jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)
    runButton = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT)
}
level.initiateElementAnimations = _ => {
    Object.keys(animate).forEach(k => {
        animate[k].setAll('body.immovable', true);
        animate[k].setAll('body.moves', false);
        animate[k].callAll('animations.add', 'animations', 'an', [0, 1, 2, 3], k=="fire"?10:5, true);
        animate[k].children.forEach(c => setTimeout(_ => c.animations.play('an'), Math.random()*70))
    })
}
level.finishLevel = function(sprite, tile) {
    if (!this.hasKey) {return false}
    game.score+=this.score;game.level++
    game.state.start("Level")
}
level.died = function(sprite, tile) {
    console.log("Died")
}
level.gotKey = function(sprite, tile) {
    console.log("Key",sprite,tile)
    this.hasKey = true
    this.addValue(1000).bind(this)(sprite, tile)
}
level.addValue = s => function(sprite, tile) {
    if(isNaN(this.score)) {this.score=0}
    this.score+=s
    map.removeTile(tile.x, tile.y, layer).destroy();
    console.log("Points",this.score)
}
level.update = () => {
    const ar = game.physics.arcade
    ar.collide(nanthy.sprite, layer)
    ar.overlap(nanthy.sprite, animate.fire, level.died, null, level);
    ar.overlap(nanthy.sprite, animate.water, level.died, null, level);
    ar.overlap(nanthy.sprite, animate.electricity, level.died, null, level);
    nanthy.doNothing = true;const floored = nanthy.sprite.body.onFloor()
    const velocities = {rest: 10+(floored?0:50), speed: 200, normal: 150}
    
    if (cursors.left.isDown){
        //nanthy.sprite.body.acceleration.x = -120;
        if(nanthy.direction!='left'){
            nanthy.sprite.scale.x *= -1
            nanthy.direction = 'left'
        }
        if(nanthy.sprite.body.velocity.x==0 ||
            (nanthy.sprite.animations.currentAnim.name!='left' && floored)){
            nanthy.sprite.animations.play('left', 10, true)
        }

        nanthy.sprite.body.velocity.x -= velocities.rest
        nanthy.sprite.body.velocity.x = Math.max(nanthy.sprite.body.velocity.x,-velocities[runButton.isDown?"speed":"normal"])
        nanthy.doNothing = false
    } else if (cursors.right.isDown){
        if(nanthy.direction!='right'){
            nanthy.sprite.scale.x *= -1
            nanthy.direction = 'right'
        }
        if(nanthy.sprite.body.velocity.x==0 ||
            (nanthy.sprite.animations.currentAnim.name!='left' && floored)){
            nanthy.sprite.animations.play('left', 10, true)
        }
        nanthy.sprite.body.velocity.x += velocities.rest
        nanthy.sprite.body.velocity.x = Math.min(nanthy.sprite.body.velocity.x,velocities[runButton.isDown?"speed":"normal"])
        nanthy.doNothing = false
    }
    if (cursors.up.isDown && floored){
        nanthy.sprite.body.velocity.y = -320
        nanthy.sprite.animations.play('jump', 20, true)
        nanthy.doNothing = false
    }
    if(nanthy.doNothing){
        if(nanthy.sprite.body.velocity.x>20){
            //nanthy.sprite.body.acceleration.x = 10;
            nanthy.sprite.body.velocity.x -= 20
        }else if(nanthy.sprite.body.velocity.x<-20){
            //nanthy.sprite.body.acceleration.x = -10;
            nanthy.sprite.body.velocity.x += 20
        }else{
            //nanthy.sprite.body.acceleration.x = 0;
            nanthy.sprite.body.velocity.x = 0
        }
        if(nanthy.sprite.body.onFloor()){
            nanthy.sprite.animations.play('wait', 20, true)
        }
    }
}

level.render = () => {
    //game.debug.bodyInfo(nanthy.sprite, 32, 32)
    game.debug.body(nanthy.sprite)
}
var game = new Phaser.Game(608,320, Phaser.AUTO, 'game', undefined, true)
game.state.add("Level", level)
game.level = 1;game.score = 0
game.state.start("Level")
