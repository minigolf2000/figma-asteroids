import { Asteroid } from './asteroid'
import { Asteroids, getAsteroids } from './asteroids'
import { init } from './init'
import { FPS, getPlayer, getProjectiles, setProjectiles, isOverlapping, getWorldNode, getMultiplayerPlayers, setMultiplayerPlayers, Rectangle, setWorldRectangle } from './lib'
import { Player } from './player'
import { Projectile } from './projectile'

function scanForNewMultiplayerPlayers() {
  framesSinceCheckNewShips--
  if (framesSinceCheckNewShips === 0) {
    if (getWorldNode().getPluginData("new-ship") === "true") {
      const playerNodeId = getPlayer().getNode().id
      setMultiplayerPlayers(getWorldNode().findChildren(n => n.type === 'FRAME' && n.name === "🚀" && n.id !== playerNodeId) as FrameNode[])
    }
    framesSinceCheckNewShips = 30
  }
}

function resizeWorld() {
  framesSinceResizeWorld--
  if (framesSinceResizeWorld === 0) {
    setWorldRectangle(getWorldNode())
    framesSinceResizeWorld = 30
  }
}

function interactionsPlayerRunningIntoAsteroids(player: Player, asteroids: Asteroids) {
  const playerMidpoint = player.getCurrentMidpoint()
  if (!playerMidpoint) {
    return
  }

  for (let a of asteroids.getAll()) {
    const asteroidMidpoint = a.getCurrentMidpoint()
    if (isOverlapping(playerMidpoint, asteroidMidpoint)) {
      player.takeDamage()
      return
    }
  }
}

function interactionsProjectilesHittingAsteroids(asteroids: Asteroids) {
  let shouldScanForAllAsteroids: boolean = false
  let newAsteroids: Asteroid[] = []
  getAsteroids().setAll(asteroids.getAll().filter((a: Asteroid) => {
    const asteroidNode = a.getNode()
    if (!asteroidNode) {
      shouldScanForAllAsteroids = true
      return false
    }
    const asteroidHitbox = a.getCurrentMidpoint()
    let asteroidStillAlive = true

    setProjectiles(getProjectiles().filter((projectile: Projectile) => {
      if (!asteroidStillAlive) { return true }
      const hitVector = isOverlapping(asteroidHitbox, projectile.getCurrentMidpoint())
      if (hitVector) {
        projectile.getNode().remove()

        newAsteroids = newAsteroids.concat(a.takeDamage())
        asteroidNode.remove()
        asteroidStillAlive = false
        return false
      }
      return true
    }))
    return asteroidStillAlive
  }).concat(newAsteroids))

  return shouldScanForAllAsteroids
}

function interactionsPlayerRunningIntoProjectiles(player: Player) {
  // Current player running into their own projectiles. Friendly fire
  setProjectiles(getProjectiles().filter((projectile: Projectile) => {
    const playerMidpoint = player.getCurrentMidpoint()
    if (playerMidpoint && isOverlapping(playerMidpoint, projectile.getCurrentMidpoint())) {
      player.takeDamage()
      projectile.getNode().remove()
      return false
    }
    return true
  }))
}

function interactionsProjectilesHittingMultiplayerPlayers() {
  // Projectiles hitting Multiplayer ships
  setMultiplayerPlayers(getMultiplayerPlayers().filter((p: FrameNode) => {
    if (p.removed) {
      // node has been removed by another
      return false
    }
    const multiplayerPlayerHitbox: Rectangle = {
      x: p.x,
      y: p.y,
      diameter: p.width,
      rotation: p.rotation,
    }
    let pStillAlive = true

    setProjectiles(getProjectiles().filter((projectile: Projectile) => {
      if (!pStillAlive) { return true }
      const hitVector = isOverlapping(multiplayerPlayerHitbox, projectile.getCurrentMidpoint())
      if (hitVector) {
        projectile.getNode().remove()

        p.visible = false
        pStillAlive = false
        return false
      }
      return true
    }))
    return pStillAlive
  }))
}


// Game loop run by multiplayerPlayers
function nextFrame() {
  const player = getPlayer()
  if (player.buttonsPressed.esc) {
    figma.closePlugin()
    return
  }
  if (getWorldNode().removed) {
    figma.closePlugin("World was deleted, exiting plugin")
    return
  }

  // scan for new asteroids on every frame
  new Asteroids(getWorldNode().children)

  player.nextFrame()

  const asteroids = getAsteroids()
  interactionsPlayerRunningIntoProjectiles(player)
  interactionsProjectilesHittingMultiplayerPlayers()
  interactionsPlayerRunningIntoAsteroids(getPlayer(), asteroids)
  interactionsProjectilesHittingAsteroids(asteroids)

  setProjectiles(getProjectiles().filter(projectile => !!projectile.nextFrame()))

  scanForNewMultiplayerPlayers()
  resizeWorld()

  if (isServer) {
    getAsteroids().nextFrame()
  }
}

let lastFrameTimestamp: number = Date.now()
export function printFPS() {
  const currentFrameTimestamp = Date.now()
  const fps = Math.round(1000 / (currentFrameTimestamp - lastFrameTimestamp))
  lastFrameTimestamp = currentFrameTimestamp
  console.info(`fps: ${fps}`)
}

let framesSinceCheckNewShips = 30
let framesSinceResizeWorld = 15

const isServer = init()
setInterval(nextFrame, 1000 / FPS)