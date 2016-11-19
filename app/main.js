//TODO: Level 5 triangular bodies for slanted blocks
//TODO: Die animation for Nanthy
//TODO: Enemies in all levels swapped with the Cloud Sprite
//TODO: Climb Animation link with climbable block [Tree leaves/Trunks, Stars]
//TODO: Sound effect when point-valued blocks are collected
//TODO: Jetpack ammo
//TODO: Nanthy Lives and View Toolbar, and Footer with Gun/Jetpack/Key Flags [Can prolly use Polymer]
var map, layer, cursors, jumpButton, buttons = {}, result, animate, gun
const BLOCK_SZ = 32
const isNanthy = s => s==nanthy.sprite
const nanthy = {
    sprite: undefined,
    direction: 'right',
    doNothing: true,
    respawn: _ => {
        const d = level.data, {x:s_x,y:s_y} = d?d.spawn:{x:2,y:8}
        const yc = layer.position.y+game.world.height/10*(s_y+1)-nanthy.sprite.height/2,
            xc = layer.position.x+BLOCK_SZ*s_x+nanthy.sprite.width/2
        nanthy.sprite.reset(xc,yc)
        nanthy.sprite.scale.x = Math.abs(nanthy.sprite.scale.x)
        nanthy.direction = "right"
        nanthy.sprite.body.width = nanthy.sprite.width/3
    },
    resetMe: _ => {
        nanthy.respawn()
        level.hasKey=nanthy.hasGun=nanthy.hasJet=nanthy.jet=false
    }
}, level = {}

var gong, music

level.preload = _ => {
  game.load.json('levelData', '../assets/Level-'+game.level+'.config.json');
  game.load.tilemap('objects', '../assets/Level-'+game.level+'.json', null, Phaser.Tilemap.TILED_JSON)
  game.load.image('tiles', '../assets/items2.png')
  game.load.image('bullet', '../assets/bullet.png')
  game.load.spritesheet('nanthy', '../assets/Dave.png', 36, BLOCK_SZ)
  game.load.spritesheet('electricity', '../assets/electricity.png', BLOCK_SZ, BLOCK_SZ)
  game.load.spritesheet('water', '../assets/water.png', BLOCK_SZ, BLOCK_SZ)
  game.load.spritesheet('fire', '../assets/fire.png', BLOCK_SZ, BLOCK_SZ)
  game.load.spritesheet('chalice', '../assets/chalice.png', BLOCK_SZ, BLOCK_SZ)
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
    //= Level Inits ========================|
    level.score = game.score
    level.data = game.cache.getJSON('levelData')
    //= Collisions =========================|
    map.setCollisionBetween(14, 16)
    map.setCollisionBetween(27, 28)
    map.setCollisionByIndex(23)
    map.setCollisionByIndex(34)
    map.setCollisionByIndex(39)
    map.setCollisionByIndex(17)
    map.setCollisionByIndex(18)
    map.setCollisionByIndex(40)
    // All id's are incremented by 1
    ;[14,15,16,17,18,23,27,28,39,40].forEach(i => map.setTileIndexCallback(i, level.bulletKill, level));
    map.setTileIndexCallback(3, level.gotJetpack, level);
    map.setTileIndexCallback(13, level.gotGun, level);
    map.setTileIndexCallback(19, level.gotKey, level);
    map.setTileIndexCallback(10, level.finishLevel, level);
    map.setTileIndexCallback(5, level.addValue(50), level);
    map.setTileIndexCallback(11, level.addValue(100), level);
    map.setTileIndexCallback(12, level.addValue(150), level);
    map.setTileIndexCallback(26, level.addValue(200), level);
    map.setTileIndexCallback(24, level.addValue(300), level);
    map.setTileIndexCallback(25, level.addValue(500), level);
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

    game.physics.enable(nanthy.sprite)
    game.physics.arcade.gravity.y = 700
    //= Nanthy ==============================|
    nanthy.sprite.body.bounce.y = 0
    nanthy.sprite.body.width = nanthy.sprite.width/3
    nanthy.sprite.body.offset.x=(nanthy.sprite.width-nanthy.sprite.body.width)/2
    nanthy.sprite.body.linearDamping = 1
    nanthy.sprite.body.collideWorldBounds = false

    //nanthy.sprite.body.acceleration.x = 120;

    nanthy.sprite.animations.add('left', [1,2,3,2], 10, true)
    nanthy.sprite.animations.add('wait', [0], 10, true)
    nanthy.sprite.animations.add('jetpack', [5,6,7], 10, true)
    nanthy.sprite.animations.add('jump', [4], 10, true)
    nanthy.sprite.animations.add('climb', [8,9,10,9], 10, true)

    nanthy.sprite.body.fixedRotation = true
    nanthy.resetMe()
    nanthy.tweener = game.add.tween(nanthy.sprite.position).to({y: "+2"}, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true)
    nanthy.tweener.stop()
    //= Bullets ==============================|
    gun = game.add.weapon(2,'bullet')
    gun.fireRate = 500;gun.fireAngle = 0;gun.bulletSpeed = 300
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
        animate[k].children.forEach(c => {
            if (c=="chalice") {return}
            const bodySize = s => ({fire: c.width*.8/2})[s] || c.width*.9/2
            const offset = s => ({fire: [c.width*.2/2+1,c.width*.2/.8]})[s] || [c.width*.1/2,c.height*.1/2]
            c.body.setCircle(bodySize(k))
            c.body.offset.setTo(...offset(k))

        })
    })
}
level.finishLevel = function(sprite, tile) {
    if (!isNanthy(sprite) || !this.hasKey) {return false}
    game.score+=this.score+2000;game.level++
    game.state.start("Level")
}
level.bulletKill = function(sprite, tile) {
    if (isNanthy(sprite)){return true}
    sprite.kill()
    return true
}
level.died = function(sprite, tile) {
    if (!isNanthy(sprite)){return}
    console.log("Died")
    sprite.kill()
    sprite = this.game.add.sprite(sprite.x, sprite.y, "fire")
    sprite.anchor.setTo(0.5,0.5)
    sprite.animations.add("fire", [0, 1, 2, 3], 2, false)
    sprite.animations.play("fire")
    sprite.animations.currentAnim.onComplete.add(_ => {
        this.gamePaused = true
        nanthy.respawn()
    }, this)
}
level.gotGun = function(sprite, tile) {if (!isNanthy(sprite)){return};nanthy.hasGun = true;this.clearTile(tile)}
level.gotJetpack = function(sprite, tile) {if (!isNanthy(sprite)){return};nanthy.hasJet = true;this.clearTile(tile)}
level.gotKey = function(sprite, tile) {
    if (!isNanthy(sprite)){return}
    gong.play()
    tile.destroy()
    this.hasKey = true
    this.addScore(1000)
}
level.clearTile = (function(t) {t && map.removeTile(t.x, t.y, layer).destroy()}).bind(level)
level.addScore = (function(s) {this.setScore(this.score+(s||0))}).bind(level)
level.setScore = (function(s) {
    this.score=s||0
    if(isNaN(this.score)) {this.score = 0}
    level.scoreText.setText(`Score: ${this.score}`)
}).bind(level)
level.addValue = s => function(sprite, tile) {
    if (sprite && !isNanthy(sprite)){return}
    this.addScore(s)
    this.clearTile(tile)
}
level.toggleJetpack = function() {
    if (!nanthy.hasJet || !nanthy.sprite.alive || (this._nextToggle_jet && this.game.time.time < this._nextToggle_jet)) {return}
    this._nextToggle_jet = this.game.time.time + 300
    nanthy.jet = !nanthy.jet
    if (nanthy.jet) {
        nanthy.tweener.start()
    } else {nanthy.tweener && nanthy.tweener.stop()}
}
level.shootGun = function() {
    if (!nanthy.hasGun || !nanthy.sprite.alive) {return}
    gun.fireAngle = nanthy.direction==="right"?0:180
    gun.fireFrom.setTo(nanthy.sprite.x+(gun.fireAngle?-1:1)*8, nanthy.sprite.y - 8);
    gun.fire()
}
level.update = _ => {
    const ar = game.physics.arcade
    ar.collide(nanthy.sprite, layer)
    ar.collide(gun.bullets, layer)
    ar.overlap(nanthy.sprite, animate.fire, level.died, null, level);
    ar.overlap(nanthy.sprite, animate.water, level.died, null, level);
    ar.overlap(nanthy.sprite, animate.electricity, level.died, null, level);
    ar.overlap(nanthy.sprite, animate.chalice, level.gotKey, null, level);
    nanthy.doNothing = true
    //= Modes ==========|
    if (buttons.gun.isDown){level.shootGun.bind(level)()}
    if (buttons.jet.isDown){level.toggleJetpack.bind(level)()}
    //= Movement =======|
    if (nanthy.hasJet && nanthy.jet) {level.jetControls.bind(level)()}
    else {level.movementControls.bind(level)()}
    //= Warping ========|
    if (nanthy.sprite.y < -32) {nanthy.sprite.y = game.world.height + 32/2}
    if (nanthy.sprite.y > game.world.height + 32) {nanthy.sprite.y = -32/2}
    //= Terminal ========|
    nanthy.sprite.body.velocity.y = Math.min(nanthy.sprite.body.velocity.y,400)
}

level.ensureDirection = function(dir){
    if (nanthy.direction==dir) {return}
    if (nanthy.direction=="left" && nanthy.sprite.scale.x > 0) {nanthy.sprite.scale.x*=-1} //Calibrate
    nanthy.sprite.scale.x *= -1;nanthy.direction = dir
}

level.jetControls = function(){
    nanthy.sprite.animations.play('jetpack', 10, true)
    const velocities = {jet: 150}, delta = {x:0,y:0}
    if (cursors.left.isDown) {level.ensureDirection("left");delta.x-=velocities.jet}
    else if (cursors.right.isDown) {level.ensureDirection("right");delta.x+=velocities.jet}
    if (cursors.up.isDown) {delta.y-=velocities.jet}
    else if (cursors.down.isDown) {delta.y+=velocities.jet}
    nanthy.sprite.body.velocity.x=delta.x
    nanthy.sprite.body.velocity.y=delta.y-12
}
level.movementControls = function(){
    const floored = nanthy.sprite.body.onFloor()
    const velocities = {rest: 10+(floored?0:50), speed: 200, normal: 150, jump: 320}
    if (cursors.left.isDown){
        level.ensureDirection("left")
        if(nanthy.sprite.body.velocity.x==0 ||
            (nanthy.sprite.animations.currentAnim.name!='left' && floored)){
            nanthy.sprite.animations.play('left', 10, true)
        }
        nanthy.sprite.body.velocity.x -= velocities.rest
        nanthy.sprite.body.velocity.x = Math.max(nanthy.sprite.body.velocity.x,-velocities[buttons.run.isDown?"speed":"normal"])
        nanthy.doNothing = false
    } else if (cursors.right.isDown){
        level.ensureDirection("right")
        if(nanthy.sprite.body.velocity.x==0 ||
            (nanthy.sprite.animations.currentAnim.name!='left' && floored)){
            nanthy.sprite.animations.play('left', 10, true)
        }
        nanthy.sprite.body.velocity.x += velocities.rest
        nanthy.sprite.body.velocity.x = Math.min(nanthy.sprite.body.velocity.x,velocities[buttons.run.isDown?"speed":"normal"])
        nanthy.doNothing = false
    }
    if (cursors.up.isDown){
        nanthy.sprite.animations.play('jump', 20, true)
        if (floored){
            nanthy.sprite.body.velocity.y = -velocities.jump
            nanthy.doNothing = false
        }
    }
    if (nanthy.sprite.animations.currentAnim.name=='jetpack') {nanthy.sprite.animations.play(floored?'left':'jump', 10, true)}
    if(nanthy.doNothing){
        if(nanthy.sprite.body.velocity.x>20){
            nanthy.sprite.body.velocity.x -= 20
        }else if(nanthy.sprite.body.velocity.x<-20){
            nanthy.sprite.body.velocity.x += 20
        }else{
            nanthy.sprite.body.velocity.x = 0
        }
        if(floored){nanthy.sprite.animations.play('wait', 20, true)}
    }
}

level.render = _ => {
    //game.debug.bodyInfo(nanthy.sprite, 32, 32)
    game.debug.body(nanthy.sprite)
    //animate.fire.children.forEach(e => game.debug.body(e))
    //animate.water.children.forEach(e => game.debug.body(e))
}
var game = new Phaser.Game(608,320+10*2, Phaser.AUTO, 'game', undefined, true)
game.state.add("Level", level)
game.level = 1;game.score = 0
game.state.start("Level")
