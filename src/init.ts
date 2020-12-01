import { Asteroids, setupAsteroids } from './asteroids'
import { onButtonsPressed } from './buttons'
import { getPlayer, getWorldNode, setPlayer, setWorldNode, setWorldRectangle } from './lib'
import { Player } from './player'

// Return true if initializing as the server
// Return false if initializing as a client
export function init() {
  // TODO: support configurable player numLives?

  const alreadyRunningWorld: FrameNode = figma.currentPage.children.find(n => n.type === "FRAME" && n.name.includes(" (running)")) as FrameNode
  if (alreadyRunningWorld) {
    sharedSetup(alreadyRunningWorld)
    return false
  }

  let templateWorldNode: FrameNode | null = findNearestFrameAncestor()
  let worldNode: FrameNode | null
  if (templateWorldNode) {
    templateWorldNode.visible = false
    templateWorldNode.setRelaunchData({relaunch: ''})
    worldNode = templateWorldNode.clone()
  } else {
    worldNode = figma.createFrame()

    worldNode.name = "Asteroids"
    worldNode.fills = [{color: {r: 1 / 255, g: 1 / 255, b: 1 / 255}, type: "SOLID"}]

    const defaultWorldSize = 1000
    worldNode.resize(defaultWorldSize, defaultWorldSize)

    worldNode.x = figma.viewport.center.x - defaultWorldSize / 2
    worldNode.y = figma.viewport.center.y - defaultWorldSize / 2

  }
  worldNode.name = `${worldNode.name} (running)`
  worldNode.expanded = false // collapse this for performance by avoiding layers panel rerenders
  worldNode.visible = true

  if (worldNode.children.length === 0) {
    for (let i = 0; i < 6; i++) {
      const svg = figma.createNodeFromSvg(`<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M29.7545 39.5H20.5V25.8824V24.3114L19.592 25.5933L10 39.135L0.753112 26.0805L10.2129 21.6289L10.9899 21.2632L10.2883 20.768L0.771227 14.05L14.2083 0.5H30.7258L39.5 14.2635V26.8882L29.7545 39.5Z" stroke="white"/>
      </svg>
      `)
      const asteroid = svg.children[0] as RectangleNode
      asteroid.fills = [{color: {r: 0, g: 0, b: 0}, type: "SOLID"}]
      asteroid.strokes = [{color: {r: 255 / 255, g: 255 / 255, b: 255 / 255}, type: "SOLID"}]
      const defaultAsteroidSize = 40
      asteroid.name = "☄️"
      asteroid.resize(defaultAsteroidSize, defaultAsteroidSize)
      asteroid.x = Math.random() * worldNode.width - defaultAsteroidSize
      asteroid.y = Math.random() * worldNode.height - defaultAsteroidSize
      worldNode.appendChild(asteroid)
      svg.remove()
    }
  }
  setupAsteroids(worldNode.children)
  sharedSetup(worldNode)

  figma.currentPage.setRelaunchData({relaunch: ''})
  worldNode.setRelaunchData({relaunch: ''})

  figma.on("close", () => {
    !getWorldNode().removed && getWorldNode().remove()
    if (templateWorldNode) {
      templateWorldNode.visible = true
    }
  })

  return true
}

const findNearestFrameAncestor = () => {
  let current: SceneNode | null = figma.currentPage.selection[0]
  while (current) {
    if (current.type === 'FRAME') { return current as FrameNode }
    current = current.parent as SceneNode | null
  }
  return null
}

const sharedSetup = (worldNode: FrameNode) => {
  setWorldNode(worldNode)
  setWorldRectangle(worldNode)
  figma.showUI(__html__, {width: 330, height: 130})

  // set zoom to be really tiny, then call scrollAndZoomIntoView to center it on the world
  figma.viewport.center = {x: worldNode.x + worldNode.width, y: worldNode.y + worldNode.height}
  figma.viewport.zoom = 100
  figma.viewport.scrollAndZoomIntoView([getWorldNode()])

  new Asteroids(worldNode.children)

  const player = new Player()
  setPlayer(player)
  worldNode.appendChild(player.getNode())
  worldNode.setPluginData("new-ship", "true")

  const pastSelection: string[] = figma.currentPage.selection.map(n => n.id)
  figma.currentPage.selection = []
  figma.ui.onmessage = (m) => onButtonsPressed(m, getPlayer().buttonsPressed)


  figma.on("close", () => {
    figma.currentPage.selection = pastSelection.map(id => figma.getNodeById(id)).filter(n => !!n) as SceneNode[]
    !getPlayer().getProjectileFrameNode().removed && getPlayer().getProjectileFrameNode().remove()
    !getPlayer().getNode().removed && getPlayer().getNode().remove()
  })

}
