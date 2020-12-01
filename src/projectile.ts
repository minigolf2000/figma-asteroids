import { loopAround } from "./lib"
import { Rectangle } from "./lib"
import { add, multiply, normalize } from "./vector"

const LIFESPAN_FRAMES = 60
const SPEED = 7

export class Projectile {
  private currentRectangle: Rectangle // repeatedly accessing Figma node objects is slow. store this value locally
  private frames: number = 0
  private node: RectangleNode
  private velocity: Vector

  public constructor(shipRectangle: Rectangle, color: RGB, parentNode: FrameNode) {
    this.node = figma.createRectangle()
    parentNode.appendChild(this.node)
    this.node.name = "·"
    this.node.fills = [{color, type: "SOLID"}]
    this.node.strokes = [{color: {r: 1 / 255, g: 1 / 255, b: 1 / 255}, type: "SOLID", opacity: .3}]
    this.node.cornerRadius = 4
    this.node.resize(4, 4)

    let {x, y} = shipRectangle

    this.velocity = velocityFromShipRotation(shipRectangle.rotation)
    x += this.velocity.x * 2 - 1
    y += this.velocity.y * 2 - 1
    this.currentRectangle = {x, y, diameter: 4, rotation: 0}
    this.node.x = x
    this.node.y = y
  }

  public getNode() {
    return this.node
  }

  public getCurrentMidpoint(): Rectangle {
    return this.currentRectangle
  }

  public setCurrentPosition(position: Vector) {
    this.currentRectangle.x = position.x
    this.currentRectangle.y = position.y

    this.node.x = position.x
    this.node.y = position.y
  }

  public nextFrame() {
    this.frames++
    this.setCurrentPosition(loopAround(add(this.currentRectangle, this.velocity)))
    if (this.frames <= LIFESPAN_FRAMES) {
      return true
    } else {
      this.node.remove()
      return false
    }
  }
}

function velocityFromShipRotation(shipRotation: number) {
  const directionVector = {x: -Math.sin(shipRotation * Math.PI / 180), y: -Math.cos(shipRotation * Math.PI / 180)}
  return multiply(normalize(directionVector), SPEED)
}
