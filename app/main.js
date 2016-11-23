//TODO: Level 5 triangular bodies for slanted blocks
//TODO: Extract explosion for Nanthy death animation
//TODO: Enemies in all levels swapped with the Cloud Sprite
//TODO: Climb Animation link with climbable block [Tree leaves/Trunks, Stars]
//TODO: Sound effect when point-valued blocks are collected
//TODO: Jetpack ammo
//TODO: Nanthy Lives and View Toolbar, and Footer with Gun/Jetpack/Key Flags [Can prolly use Polymer]
var map, layer, cursors, jumpButton, buttons = {}, result, animate, gun
const BLOCK_SZ = 32, sleep = t => new Promise(res => setTimeout(res,t))
const isNanthy = s => s==nanthy.sprite,
    fmtNum = n => {const [f,l] = n.toString().split(".");return f.replace(/\B(?=(\d{3})+(?!\d))/g, ",")+(l?"."+l:'')}
const nanthy = {
    sprite: undefined,
    direction: 'right',
    doNothing: true,
    respawn: _ => {
        const d = level.data, {x:s_x,y:s_y} = d?d.spawn:{x:2,y:8}
        const yc = layer.position.y+game.world.height/10*(s_y+1)-nanthy.sprite.height/2,
            xc = BLOCK_SZ*s_x+nanthy.sprite.width/2
        nanthy.sprite.reset(xc,yc)
        nanthy.sprite.scale.x = Math.abs(nanthy.sprite.scale.x)
        nanthy.direction = "right"
        ;[10,100,1000].forEach(t => sleep(t).then(_=>{nanthy.sprite.body.width = Math.abs(nanthy.sprite.width/3)}));
        level.bornTween && level.bornTween.stop()
        //API: properties, duration, ease, autoStart, delay, 4, yoyo
        level.bornTween = game.add.tween(nanthy.sprite).to({alpha: 0}, 400, Phaser.Easing.Bounce.InOut, true, 0, -1, true)
        level.bornTween.start()
        nanthy.sprite.body.moves = !(level.gameInit = true)
        nanthy.sprite.animations.play('wait', 20, true)
    },
    unInit: _ => {
        nanthy.sprite.body.moves = !(level.gameInit = false)
        level.bornTween && level.bornTween.stop()
        nanthy.sprite.alpha=1
    },
    resetMe: _ => {
        nanthy.respawn()
        level.hasKey=nanthy.hasGun=nanthy.hasJet=nanthy.jet=false
    }
}, level = {}

const _AUDIO_LINK = [
    ['music','../assets/02 Underclocked.mp3'],
    ['gun','../assets/gun.mp3'],
    ['explosion','../assets/explosion.mp3'],
    ['gong','../assets/gong.mp3'],
    ['coin','../assets/coin.mp3'],
    ['coinDrop','../assets/coin-drop.mp3'],
    ['coin3','../assets/glass-ping.mp3'],
    ['blip','../assets/robot-blip.mp3'],
    ['itemPick','../assets/sms-alert.mp3']
], AUDIO = {}
const BLOCKS = {
    jet: 3,
    gun: 13,
    chalice: 19,
    door: 10,
    p: { //Points
        gum: 5,
        diamond: 11,
        r_diamond: 12,
        crown: 24,
        wand: 25,
        ring: 26,
    },
    c: { //Collisions
        slant: {
            bl: 14,
            br: 15,
            tl: 16,
            tr: 17,
        },
        metal_bar: 18,
        pipe: {down: 28, right: 27},
        brown: 23,
        ice: 34,
        brick: {blue: 39, red: 40},
    },
    bad: { //Bad for Nanthy
        fire: 2,
        water: 35,
        electricity: 41,
    },
    cl: { //Climbable
        trunk: 38,
        leaves: {
            tl:20,
            tr:23,
            cnt:32,
            bl:31,
            br:33,
        },
    },
    star: 36,
    g: function(p) {
        const ev = v => typeof v == "function"?v():v,
            recurseVal = (v,ar) => {const a = ar||[];typeof v == "object"?Object.keys(v).forEach(i => recurseVal(v[i],a)):a.push(v);if (!ar) {return a}}
            pth = p.split(".")
        let val = pth.reduce((pr,c) => ev(pr[c])||"",this)
        if (typeof val == "function") {val = val()}
        else if (typeof val == "object") {val = recurseVal(val)}
        if (!val) {console.error("[Block::Fetch] Path",p,"is invalid!")}
        return val
    }
}

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
  _AUDIO_LINK.forEach(i => game.load.audio(i[0], i[1]))
}


level.create = _ => {
    game.physics.startSystem(Phaser.Physics.ARCADE)
    game.stage.backgroundColor = '#000000'
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
    map = game.add.tilemap('objects')
    _AUDIO_LINK.forEach(i => {
        const k = i[0]
        AUDIO[k] = AUDIO[k] || game.add.audio(k)
    })
    //coinSounds[50] = coinSounds[50] || game.add.audio('coin1')
    //coinSounds[100] = coinSounds[100] || game.add.audio('coin2')
    //coinSounds[150] = coinSounds[150] || game.add.audio('coin3')
    //coinSounds[200] = coinSounds[200] || game.add.audio('coin4')
    //coinSounds[300] = coinSounds[300] || game.add.audio('coin5')
    //coinSounds[500] = coinSounds[500] || game.add.audio('coin6')
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
    map.setTileIndexCallback(5, level.itemPickup(50), level);
    map.setTileIndexCallback(11, level.itemPickup(100), level);
    map.setTileIndexCallback(12, level.itemPickup(150), level);
    map.setTileIndexCallback(26, level.itemPickup(200), level);
    map.setTileIndexCallback(24, level.itemPickup(300), level);
    map.setTileIndexCallback(25, level.itemPickup(500), level);
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
    level.scoreText = game.add.text(400,0, ``, {font: "32px Raleway,Arial", fill: "#23b929", boundsAlignH: "right"})
    level.setScore(level.score)
    level.scoreText.fixedToCamera = true
    //level.text.position.y = (50-level.text.height)/2
    //nanthy.sprite.body.onBeginContact.add(blockHit, this);

    game.camera.follow(nanthy.sprite)
    cursors = game.input.keyboard.createCursorKeys()
    buttons.run = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT)
    buttons.jet = game.input.keyboard.addKey(Phaser.Keyboard.ALT)
    buttons.gun = game.input.keyboard.addKey(Phaser.Keyboard.CONTROL)
    AUDIO.music.onStop.add(AUDIO.music.play, this)
    AUDIO.music.play()
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
    level.bornTween = ""
    game.score=this.score+2000;game.level++
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
        nanthy.respawn()
        sleep(200).then(_ => sprite.destroy())
    }, this)
    AUDIO.explosion.play()
}
level.itemPickup = value => (sprite, tile) => {
    const Matchers = {}
    Matchers[BLOCKS.p.gum] = "coin"
    Matchers[BLOCKS.p.diamond] = "coin"
    Matchers[BLOCKS.p.r_diamond] = "coin"
    Matchers[BLOCKS.p.crown] = "coin"
    Matchers[BLOCKS.p.wand] = "coin"
    Matchers[BLOCKS.p.ring] = "coin"
    if (!isNanthy(sprite)){return}
    (level.addValue(value).bind(level))(sprite, tile)
    const track = AUDIO[Matchers[tile.index]]
    track && track.play()
}
level.gotGun = function(sprite, tile) {if (!isNanthy(sprite)){return};nanthy.hasGun = true;this.clearTile(tile)}
level.gotJetpack = function(sprite, tile) {if (!isNanthy(sprite)){return};nanthy.hasJet = true;this.clearTile(tile)}
level.gotKey = function(sprite, tile) {
    if (!isNanthy(sprite)){return}
    AUDIO.gong.play()
    tile.destroy()
    this.hasKey = true
    this.addScore(1000)
}
level.clearTile = (function(t) {t && map.removeTile(t.x, t.y, layer).destroy()}).bind(level)
level.addScore = (function(s) {this.setScore(this.score+(s||0))}).bind(level)
level.setScore = (function(s) {
    this.score=s||0
    if(isNaN(this.score)) {this.score = 0}
    level.scoreText.setText(`Score: ${fmtNum(this.score)}`)
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
    gun.fire() && AUDIO.gunSound.play()
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
    if (nanthy.hasJet && nanthy.jet && !level.gameInit) {level.jetControls.bind(level)()}
    else {level.movementControls.bind(level)()}
    //= Warping ========|
    if (nanthy.sprite.y < -BLOCK_SZ) {nanthy.sprite.y = game.world.height + BLOCK_SZ}
    if (nanthy.sprite.y > game.world.height + 32) {nanthy.sprite.y = -BLOCK_SZ}
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
    const floored = nanthy.sprite.body.onFloor(),
        velocities = {rest: 10+(floored?0:50), speed: 200, normal: 150, jump: 320},
        gameInit = _ => level.gameInit && nanthy.unInit()

    if (cursors.left.isDown){gameInit()
        level.ensureDirection("left")
        if(nanthy.sprite.body.velocity.x==0 ||
            (nanthy.sprite.animations.currentAnim.name!='left' && floored)){
            nanthy.sprite.animations.play('left', 10, true)
        }
        nanthy.sprite.body.velocity.x -= velocities.rest
        nanthy.sprite.body.velocity.x = Math.max(nanthy.sprite.body.velocity.x,-velocities[buttons.run.isDown?"speed":"normal"])
        nanthy.doNothing = false
    } else if (cursors.right.isDown){gameInit()
        level.ensureDirection("right")
        if(nanthy.sprite.body.velocity.x==0 ||
            (nanthy.sprite.animations.currentAnim.name!='left' && floored)){
            nanthy.sprite.animations.play('left', 10, true)
        }
        nanthy.sprite.body.velocity.x += velocities.rest
        nanthy.sprite.body.velocity.x = Math.min(nanthy.sprite.body.velocity.x,velocities[buttons.run.isDown?"speed":"normal"])
        nanthy.doNothing = false
    }
    if (cursors.up.isDown){gameInit()
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
    //game.debug.body(nanthy.sprite)
    //animate.fire.children.forEach(e => game.debug.body(e))
    //animate.water.children.forEach(e => game.debug.body(e))
}
var game = new Phaser.Game(608,320+10*2, Phaser.AUTO, 'game', undefined, true)
game.state.add("Level", level)
game.level = 1;game.score = 0
game.state.start("Level")
