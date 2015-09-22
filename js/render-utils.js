import $ from "jquery"

export function preserveFocusAndSelection(renderer) {
    function saveProps(element, ...names) {
        const props = {}

        if (element) {
            names.forEach(name => {
                try {
                    props[name] = element[name]
                } catch (e) {
                    // Some DOM properties can throw exception if you try to access them inappropriately
                }
            })
        }

        return props
    }

    return (...args) => {
        const active = saveProps(document.activeElement, "id", "selectionEnd", "selectionStart", "selectionDirection")

        renderer(...args)

        if (active.id) {
            const el = document.getElementById(active.id)
            if (el) {
              el.focus && el.focus()
              try {
                  el.setSelectionRange && el.setSelectionRange(active.selectionStart, active.selectionEnd, active.selectionDirection)
              } catch (e) {
                  // Some elements may throw an exception if you can't set the selection range
              }
            }
        }
    }
}

let rendering = false

export function render(renderer) {
  return (...args) => {
    rendering = true
    try {
      renderer(...args)
    } finally {
      rendering = false
    }
  }
}

export function isRendering() {
  return rendering
}

export function whenNotRendering(then, otherwise) {
  return function(...args) {
    if (!isRendering()) {
      return then.call(this, ...args)
    } else if (otherwise) {
      return otherwise.call(this, ...args)
    }
  }
}
