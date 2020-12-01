export interface Buttons {
  up: boolean
  left: boolean
  right: boolean
  x: boolean
  esc: boolean
}

export function onButtonsPressed(msg: any, buttonsPressed: Buttons) {
  switch (msg.keyCode as number) {
    case 13: // ENTER
    case 16: // SHIFT
    case 32: // SPACE
    case 88: // X
    case 190: // .
    case 90: // Z
    case 188: // ,
      buttonsPressed.x = msg.type === 'keydown'
      break
    case 37: // LEFT_ARROW
    case 65: // A
      buttonsPressed.left = msg.type === 'keydown'
      break
    case 38: // UP_ARROW
    case 87: // W
      buttonsPressed.up = msg.type === 'keydown'
      break
    case 39: // RIGHT_ARROW
    case 68: // D
      buttonsPressed.right = msg.type === 'keydown'
      break
    case 27: // ESC
      buttonsPressed.esc = true
      break
  }
}
