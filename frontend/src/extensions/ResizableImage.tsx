import Image from '@tiptap/extension-image'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

function ResizableImageNodeView(props: NodeViewProps) {
  return (
    <NodeViewWrapper
      className="resizable-image-wrapper relative inline-block group max-w-full"
      style={{
        width: props.node.attrs.width || '100%',
        maxWidth: '100%',
      }}
    >
      <img
        src={props.node.attrs.src}
        alt={props.node.attrs.alt}
        title={props.node.attrs.title}
        className={`w-full h-auto block ${props.selected ? 'ring-2 ring-indigo-500 rounded-sm' : ''}`}
        style={{ minWidth: '50px' }}
      />
      {props.editor.isEditable && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-white border border-slate-300 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-nwse-resize rounded-sm"
          onMouseDown={(event) => {
            event.preventDefault()
            const startX = event.clientX
            const wrapper = (event.target as HTMLElement).closest('.resizable-image-wrapper') as HTMLElement
            const startWidth = wrapper.offsetWidth

            const onMouseMove = (e: MouseEvent) => {
              const currentX = e.clientX
              const newWidth = Math.max(50, startWidth + (currentX - startX))
              props.updateAttributes({ width: `${newWidth}px` })
            }

            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove)
              document.removeEventListener('mouseup', onMouseUp)
            }

            document.addEventListener('mousemove', onMouseMove)
            document.addEventListener('mouseup', onMouseUp)
          }}
        />
      )}
    </NodeViewWrapper>
  )
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width') || element.style.width,
        renderHTML: attributes => {
          if (!attributes.width) return {}
          return {
            width: attributes.width,
            style: `width: ${attributes.width}`,
          }
        },
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView)
  },
})
