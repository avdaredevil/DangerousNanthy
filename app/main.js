
var map, layer, cursors, jumpButton, buttons = {}, result, animate, gun

const nanthy = {
    sprite: undefined,
    direction: 'right',
    doNothing: true,
    resetMe: _ => {
        nanthy.sprite.y = layer.position.y+320/10*9-nanthy.sprite.height/2
        nanthy.sprite.x = layer.position.x+32*2+nanthy.sprite.width/2
        nanthy.sprite.scale.x = Math.abs(nanthy.sprite.scale.x)
        nanthy.direction = "right"
        level.hasKey=nanthy.gun=nanthy.jet=false
    }
}, level = {}

var gong, music

level.preload = _ => {
  game.load.tilemap('objects', '../assets/Level-'+game.level+'.json', null, Phaser.Tilemap.TILED_JSON)
  game.load.image('tiles', '../assets/items2.png')
  game.load.image('bullet', '../assets/bullet.png')
  game.load.spritesheet('nanthy', '../assets/Dave.png', 32, 32, 7)
  game.load.spritesheet('electricity', '../assets/electricity.png', 32, 32)
  game.load.spritesheet('water', '../assets/water.png', 32, 32)
  game.load.spritesheet('fire', '../assets/fire.png', 32, 32)
  game.load.spritesheet('chalice', '../assets/chalice.png', 32, 32)
  game.load.audio('gong', '../assets/gong.mp3')
  game.load.audio('music', '../assets/02 Underclocked.mp3')
}

level.create = _ => {
    game.physics.startSystem(Phaser.Physics.ARCADE)
    game.stage.backgroundColor = '#000000'
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
    map = game.add.tilemap('objects')
    music = music || game.add.audio('music')
    gong = gong || game.add.audio('gong')
    map.addTilesetImage('Assets', 'tiles')
    layer = map.createLayer('Level 1')
    layer.resizeWorld()
    map.setCollisionBetween(14, 16)
    map.setCollisionBetween(21, 22)
    map.setCollisionBetween(27, 28)
    //map.setCollisionByIndex(10)
    map.setCollisionByIndex(23)
    map.setCollisionByIndex(34)
    map.setCollisionByIndex(17)
    map.setCollisionByIndex(18)
    map.setCollisionByIndex(40)
    // All id's are incremented by 1
    map.setTileIndexCallback(3, level.gotJetpack, level);
    map.setTileIndexCallback(13, level.gotGun, level);
    map.setTileIndexCallback(19, level.gotKey, level);
    map.setTileIndexCallback(5, level.addValue(50), level);
    map.setTileIndexCallback(11, level.addValue(100), level);
    map.setTileIndexCallback(12, level.addValue(150), level);
    map.setTileIndexCallback(26, level.addValue(200), level);
    map.setTileIndexCallback(24, level.addValue(300), level);
    map.setTileIndexCallback(25, level.addValue(500), level);
    map.setTileIndexCallback(10, level.finishLevel, level);
    level.score = game.score
    animate = {};["fire","electricity","water","chalice"].forEach(i => {animate[i] = game.add.group()});
    Object.keys(animate).forEach(k => {
        const lookup = {chalice: 19, fire: 2, electricity: 41, water: 35}
        animate[k].enableBody = true
        map.createFromObjects(k, lookup[k], k, 0, true, false, animate[k]);
    });
    level.initiateElementAnimations()

    nanthy.sprite = game.add.sprite(32, 32, 'nanthy')
    nanthy.sprite.scale.setTo(0.91, 0.91)
    nanthy.sprite.anchor.x=0.5
    nanthy.sprite.anchor.y=0.5
    nanthy.sprite.animations.add('walk')

    game.physics.enable(nanthy.sprite)
    game.physics.arcade.gravity.y = 700
    //= Nanthy ==============================|
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
    
    //= Bullets ==============================|
    gun = gun || game.add.weapon(2,'bullet')
    gun.fireRate = 2;gun.fireAngle = 0;gun.bulletSpeed = 300
    gun.bulletGravity.y = -game.physics.arcade.gravity.y
    gun.bulletKillType = Phaser.Weapon.KILL_CAMERA_BOUNDS
    //= Texts ==============================|
    level.text = game.add.text(0,0, "Dangerous Nanthy",{font: "32px Raleway,Arial", fill: "#23b929"})
    level.text.fixedToCamera = true
    level.scoreText = game.add.text(400,0, `Score: ${level.score}`, {font: "32px Raleway,Arial", fill: "#23b929", boundsAlignH: "right"})
    level.scoreText.fixedToCamera = true
    //level.text.position.y = (50-level.text.height)/2
    //nanthy.sprite.body.onBeginContact.add(blockHit, this);

    game.camera.follow(nanthy.sprite)
    cursors = game.input.keyboard.createCursorKeys()
    buttons.run = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT)
    buttons.jet = game.input.keyboard.addKey(Phaser.Keyboard.ALT)
    buttons.gun = game.input.keyboard.addKey(Phaser.Keyboard.CONTROL)
    music.onStop.add(music.play, this)
    music.play()
}

level.initiateElementAnimations = _ => {
    Object.keys(animate).forEach(k => {
        animate[k].setAll('body.immovable', true);
        animate[k].setAll('body.moves', false);
        let anim = [0, 1, 2, 3];
        let speed = k => {
            const look = {fire: 10, chalice: 7}
            return look[k] || 5
        }
        if (k=="chalice") {anim = anim.concat(anim.slice(0,3).reverse())}
        animate[k].callAll('animations.add', 'animations', 'an', anim, speed(k), true);
        animate[k].children.forEach(c => setTimeout(_ => c.animations.play('an'), Math.random()*70))
    })
}
level.finishLevel = function(sprite, tile) {
    if (!this.hasKey) {return false}
    game.score+=this.score+2000;game.level++
    game.state.start("Level")
}
level.died = function(sprite, tile) {
    console.log("Died")
}
level.gotGun = function(...a) {nanthy.gun = true;this.addValue().bind(this)(...a)}
level.gotJetpack = function(...a) {nanthy.jet = true;this.addValue().bind(this)(...a)}
level.gotKey = function(sprite, tile) {
    console.log("Key",sprite,tile)
    gong.play()
    tile.destroy()
    this.hasKey = true
    this.addValue(1000).bind(this)()
}
level.addValue = s => function(sprite, tile) {
    if(isNaN(this.score)) {this.score=0}
    this.score+=s||0
    tile && map.removeTile(tile.x, tile.y, layer).destroy();
    level.scoreText.setText(`Score: ${this.score}`)
    console.log("Points",this.score)
}
level.shootGun = function() {
    gun.fireFrom.setTo(nanthy.sprite.x, nanthy.sprite.y - 8);
    gun.fireAngle = nanthy.direction==="right"?0:180
    gun.fire()
}
level.update = _ => {
    const ar = game.physics.arcade
    ar.collide(nanthy.sprite, layer)
    ar.overlap(nanthy.sprite, animate.fire, level.died, null, level);
    ar.overlap(nanthy.sprite, animate.water, level.died, null, level);
    ar.overlap(nanthy.sprite, animate.electricity, level.died, null, level);
    ar.overlap(nanthy.sprite, animate.chalice, level.gotKey, null, level);
    nanthy.doNothing = true;const floored = nanthy.sprite.body.onFloor()
    const velocities = {rest: 10+(floored?0:50), speed: 200, normal: 150}

    if (buttons.gun.isDown){level.shootGun.bind(level)()}
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
        nanthy.sprite.body.velocity.x = Math.max(nanthy.sprite.body.velocity.x,-velocities[buttons.run.isDown?"speed":"normal"])
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
        nanthy.sprite.body.velocity.x = Math.min(nanthy.sprite.body.velocity.x,velocities[buttons.run.isDown?"speed":"normal"])
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

level.render = _ => {
    //game.debug.bodyInfo(nanthy.sprite, 32, 32)
    //game.debug.body(nanthy.sprite)
}
var game = new Phaser.Game(608,320, Phaser.AUTO, 'game', undefined, true)
game.state.add("Level", level)
game.level = 1;game.score = 0
game.state.start("Level")
