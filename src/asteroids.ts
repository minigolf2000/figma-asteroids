import { Asteroid } from "./asteroid"
import { multiply, normalize } from "./vector"

export const setupAsteroids = (nodes: readonly SceneNode[]) => {
  return nodes.map((n: SceneNode) => {
    if (n.type === "INSTANCE") {
      n = detachNode(n)
    }
    // Clear old pluginData
    n.setPluginData("asteroid", "")
    return n
  })
}

export function speedFunction(numLives: number) {
  if (numLives === 0) {
    return 4
  } else if (numLives === 1) {
    return 2.5
  }
  return 1.5
}

let a: Asteroids
export function getAsteroids() {
  return a
}

// export let seenAsteroidIds = new Set()

export class Asteroids {
  private asteroids: Asteroid[] = []

  public constructor(nodes: readonly SceneNode[]) {
    nodes.forEach((n: SceneNode) => {
      const name = n.name
      if (name === "🚀" || name === "·" || name === "projectile-container") {
        return
      }

      const pluginData = n.getPluginData("asteroid")
      if (!pluginData || JSON.parse(pluginData).id !== n.id) { // a new asteroid has been pasted into the world
        const numLives = 2
        const velocity = multiply(normalize({x: Math.random() * 2 - 1, y: Math.random() * 2 - 1}), speedFunction(numLives))
        n.setPluginData("asteroid", JSON.stringify({velocity, numLives, id: n.id}))
      }

      this.asteroids.push(new Asteroid(n))
    })
    a = this
  }

  public getAll() {
    return this.asteroids
  }

  public setAll(a: Asteroid[]) {
    this.asteroids = a
  }

  public nextFrame() {
    this.asteroids.forEach(a => a.nextFrame())
  }
}

// It turns out fetching node data for InstanceNodes is really slow, but fetching
// node data for FrameNodes is pretty fast. When the game starts we want to detach all
// instances to be frames. This is a helper function to detach an instance
// Once Plugin API supports detaching, replace this function with the official function
function detachNode(node: InstanceNode) {
  const detached = figma.createFrame()
  detached.name = node.name
  detached.x = node.x
  detached.y = node.y
  detached.fills = node.fills
  detached.clipsContent = node.clipsContent
  detached.resize(node.width, node.height)
  node.parent?.appendChild(detached)
  node.children.forEach(c => detached.appendChild(c.clone()))
  node.remove()
  return detached
}
