import { addProjectile, getWorldNode, loopAround } from "./lib"
import { Buttons } from "./buttons"
import { Rectangle } from "./lib"
import { Projectile } from "./projectile"
import { add, magnitude, multiply, normalize } from "./vector"

const SPACESHIP_SIZE = 16
const MAX_SPEED = 5.0
const TURN_SPEED = 6.0
const THRUST_POWER = 0.25

const MULTIPLAYER_COLORS: RGB[] = [
  {r: 0 / 255, g: 181 / 255, b: 206 / 255},
  {r: 24 / 255, g: 160 / 255, b: 251 / 255},
  {r: 27 / 255, g: 196 / 255, b: 125 / 255},
  {r: 144 / 255, g: 124 / 255, b: 255 / 255},
  {r: 238 / 255, g: 70 / 255, b: 211 / 255},
  {r: 239 / 255, g: 85 / 255, b: 51 / 255},
  {r: 255 / 255, g: 199 / 255, b: 0 / 255},
]

export class Player {
  private velocity: Vector
  public buttonsPressed: Buttons = {up: false, left: false, right: false, x: false, esc: false}
  private node: FrameNode
  private thrustNode: RectangleNode
  private deathTimer: number | null = null
  private color: RGB
  private projectileFrameNode: FrameNode
  private numLives: number = 4

  private thrustLastFlickeredOn = false
  private currentMidpoint: Rectangle // repeatedly accessing Figma node objects is slow. store this value locally

  public constructor() {
    this.node = figma.createNodeFromSvg(`
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.2897 13L8 18.6656L5.71027 13L10.2897 13Z" fill="#010101" stroke="white" stroke-linecap="square"/>
    <path d="M1.5 16.9L8 1.3L14.5 16.9L8.23529 13.5588L8 13.4333L7.76471 13.5588L1.5 16.9Z" fill="#010101" stroke="white" stroke-linecap="square"/>
    </svg>
    `)

    const hullNode: RectangleNode = (this.node.children[1]! as RectangleNode)
    this.color = MULTIPLAYER_COLORS[Math.floor(Math.random() * MULTIPLAYER_COLORS.length)];
    hullNode.fills = [{color: this.color, type: "SOLID"}]
    hullNode.effects = [{type: "DROP_SHADOW", color: {r: 0, g: 0, b: 0, a: .25}, offset: {x: 0, y: 1}, radius: 4, visible: true, blendMode: "NORMAL"}]

    // Offset children so that the ship rotates about its center
    this.node.children.forEach(n => {
      n.x -= SPACESHIP_SIZE / 2
      n.y -= SPACESHIP_SIZE / 2
    })

    this.thrustNode = this.node.children[0]! as RectangleNode
    this.thrustNode.visible = false
    this.node.clipsContent = false
    this.node.name = "🚀"
    this.node.locked = true

    this.projectileFrameNode = figma.createFrame()
    this.projectileFrameNode.name = "projectile-container"
    this.projectileFrameNode.fills = []
    this.projectileFrameNode.resize(1, 1)
    this.projectileFrameNode.clipsContent = false
    this.projectileFrameNode.locked = true
    getWorldNode().appendChild(this.projectileFrameNode)

    this.newShip()
  }

  private newShip() {
    const { width, height } = getWorldNode()
    this.velocity = {x: 0, y: 0}
    this.node.rotation = 0
    // X and Y actually represent the top-left of the player's spaceship
    this.node.x = width / 2 + Math.random() * 50 - 25
    // y position is purposefully moved 75px up so that plugin window starting position does not obscure ship
    this.node.y = height / 2 + Math.random() * 25 - 100
    this.currentMidpoint = {x: this.node.x, y: this.node.y, diameter: SPACESHIP_SIZE, rotation: 0}
    figma.ui.postMessage({numLives: this.numLives, color: this.color})
  }

  public getNode() {
    return this.node
  }

  public getProjectileFrameNode() {
    return this.projectileFrameNode
  }

  public getCurrentMidpoint(): Rectangle | null {
    if (this.deathTimer) {
      return null
    }
    return this.currentMidpoint
  }

  public setCurrentPosition(position: Vector) {
    this.currentMidpoint.x = position.x
    this.currentMidpoint.y = position.y

    this.node.x = position.x
    this.node.y = position.y
  }

  public takeDamage() {
    this.deathTimer = 0
    this.node.visible = false
    figma.ui.postMessage({death: true})
  }

  public nextFrame() {
    if (this.deathTimer !== null) {
      if (this.deathTimer > 100 && this.numLives > 0) {
        this.numLives--
        this.newShip()
        this.node.visible = true
        this.deathTimer = null
        return true
      }
      this.deathTimer++
      return false
    }

    if (!this.node.visible) { // your ship can be marked invisible by other clients if they shoot you
      this.deathTimer = 0
      figma.ui.postMessage({death: true})
      return
    }

    if (this.buttonsPressed.left) {
      this.currentMidpoint.rotation += TURN_SPEED
    }
    if (this.buttonsPressed.right) {
      this.currentMidpoint.rotation -= TURN_SPEED
    }

    if (this.buttonsPressed.left || this.buttonsPressed.right) {
      this.node.rotation = this.currentMidpoint.rotation
    }

    if (this.buttonsPressed.up) {
      const directionVector = {x: -Math.sin(this.currentMidpoint.rotation * Math.PI / 180), y: -Math.cos(this.currentMidpoint.rotation * Math.PI / 180)}
      this.velocity = add(this.velocity, multiply(directionVector, THRUST_POWER))
      this.thrustNode.visible = !this.thrustLastFlickeredOn
      this.thrustLastFlickeredOn = !this.thrustLastFlickeredOn
    } else {
      this.thrustNode.visible = false
    }

    if (magnitude(this.velocity) > MAX_SPEED) {
      this.velocity = multiply(normalize(this.velocity), MAX_SPEED)
    }

    this.setCurrentPosition(loopAround(add({x: this.currentMidpoint.x, y: this.currentMidpoint.y}, this.velocity)))

    if (this.buttonsPressed.x) {
      addProjectile(new Projectile(this.currentMidpoint, this.color, this.projectileFrameNode))
      this.buttonsPressed.x = false // clear button between presses so holding down button doesn't work
    }


    // if (!temp){
    //   getWorldNode().appendChild(shipMidpointNode)
    //   temp = true
    // }
    // shipMidpointNode.x = this.currentMidpoint.x - 2
    // shipMidpointNode.y = this.currentMidpoint.y - 2
    // shipMidpointNode.resize(this.currentMidpoint.diameter, this.currentMidpoint.diameter)

    return true
  }
}

// const shipMidpointNode = figma.createRectangle()
// shipMidpointNode.name = "ship-midpoint"
// let temp = false
