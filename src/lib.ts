import { Player } from "./player"
import { Projectile } from "./projectile"
import { distance } from "./vector"

export const FPS = 30

let worldNode: FrameNode
export function setWorldNode(w: FrameNode) {
  worldNode = w
}

export function getWorldNode() {
  return worldNode
}

let worldRectangle: World
export function setWorldRectangle(w: World) {
  const {width, height} = w
  worldRectangle = {width, height}
}

let player: Player
export function setPlayer(p: Player) {
  player = p
}
export function getPlayer() {
  return player
}


let projectiles: Projectile[] = []
export function setProjectiles(l: Projectile[]) {
  projectiles = l
}
export function getProjectiles() {
  return projectiles
}

export function addProjectile(projectile: Projectile | null) {
  // TODO: simplify this?
  if (projectile && projectile.getNode() && !projectile.getNode().removed) {
    projectiles.push(projectile)
  }
}

export function loopAround(position: Vector) {
  let x = position.x
  let y = position.y

  if (position.x < 0 - 12) {
    x += worldRectangle.width + 12
  }
  if (position.x > worldRectangle.width + 12) {
    x -= worldRectangle.width + 12
  }
  if (position.y < 0 - 12) {
    y += worldRectangle.height + 12
  }
  if (position.y > worldRectangle.height + 12) {
    y -= worldRectangle.height + 12
  }

  return {x, y}
}

export interface World {
  width: number
  height: number
}

export interface Rectangle {
  x: number
  y: number
  diameter: number
  rotation: number
}

/* If rectangles are overlapping, return a normal Vector from rect1 to rect 2
 * Else return null
 */
export function isOverlapping(midpointA: Rectangle, midpointB: Rectangle) {
  return distance(midpointA, midpointB) < (midpointA.diameter + midpointB.diameter) / 2
}

let mp: FrameNode[] = []
export function getMultiplayerPlayers() {
  return mp
}

export function setMultiplayerPlayers(m: FrameNode[]) {
  mp = m
}
