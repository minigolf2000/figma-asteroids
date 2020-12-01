import { speedFunction } from "./asteroids"
import { getWorldNode, loopAround } from "./lib"
import { Rectangle } from "./lib"
import { add, multiply, normalize } from "./vector"

const SPAWN_SIZE_PROPORTION = 0.5

export class Asteroid {

  private node: SceneNode
  private isDead: boolean = false
  private velocity: Vector
  private numLives: number

  private currentRectangle: Rectangle // repeatedly accessing Figma node objects is slow. store this value locally

  public constructor(node: SceneNode) {
    this.currentRectangle = {x: node.x, y: node.y, diameter: node.width, rotation: node.rotation}
    this.node = node

    const { numLives, velocity } = JSON.parse(node.getPluginData("asteroid"))
    this.numLives = numLives
    this.velocity = velocity
  }

  public getNode() {
    return this.node
  }

  public getCurrentMidpoint(): Rectangle {
    return {
      x: this.currentRectangle.x + this.currentRectangle.diameter / 2,
      y: this.currentRectangle.y + this.currentRectangle.diameter / 2,
      diameter: this.currentRectangle.diameter,
      rotation: this.currentRectangle.rotation,
    }
  }

  public setCurrentPosition(position: Vector) {
    this.currentRectangle.x = position.x
    this.currentRectangle.y = position.y

    // This is functionally the same as:
    // this.node.x = position.x
    // this.node.y = position.y
    // But sets them both in 1 Plugin API call instead of 2
    this.node.relativeTransform = [
      [1, 0, position.x],
      [0, 1, position.y]
    ]
  }

  public takeDamage() {
    this.isDead = true

    return this.numLives > 0 ? [this.spawnSmallerAsteroid(), this.spawnSmallerAsteroid()] : []
  }

  private spawnSmallerAsteroid() {
    const spawn = this.node.clone()
    spawn.resize(this.node.width * SPAWN_SIZE_PROPORTION, this.node.height * SPAWN_SIZE_PROPORTION)
    spawn.x = this.node.x + this.node.width / 2 - spawn.width / 2
    spawn.y = this.node.y + this.node.height / 2 - spawn.height / 2
    getWorldNode().appendChild(spawn)

    const velocity = multiply(normalize({x: Math.random() * 2 - 1, y: Math.random() * 2 - 1}), speedFunction(this.numLives - 1))
    spawn.setPluginData("asteroid", JSON.stringify({velocity, numLives: this.numLives - 1, id: spawn.id}))
    return new Asteroid(spawn)
  }

  public nextFrame() {
    if (this.isDead) {
      return false
    }
    this.setCurrentPosition(loopAround(add({x: this.currentRectangle.x, y: this.currentRectangle.y}, this.velocity)))
    return true
  }
}

