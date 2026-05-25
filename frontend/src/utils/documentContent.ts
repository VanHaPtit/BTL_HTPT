import type { JSONContent } from '@tiptap/react'

interface BackendInlineFormat {
  offset: number
  length: number
  attributes?: Record<string, unknown>
}

interface BackendNode {
  type?: string
  text?: string
  formats?: BackendInlineFormat[]
  children?: BackendNode[]
  attributes?: Record<string, unknown>
}

interface BackendTree {
  children?: BackendNode[]
}

const EMPTY_DOC: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

export function parseBackendContent(raw: string | null | undefined): JSONContent {
  if (!raw) {
    return EMPTY_DOC
  }

  try {
    const parsed = JSON.parse(raw) as BackendTree | JSONContent
    if (isEditorDoc(parsed)) {
      return ensureDoc(parsed)
    }
    return fromBackendTree(parsed as BackendTree)
  } catch {
    return plainTextToDoc(raw)
  }
}

function isEditorDoc(value: BackendTree | JSONContent): value is JSONContent {
  return typeof value === 'object' && value !== null && 'type' in value
}

export function serializeEditorContent(content: JSONContent): string {
  return JSON.stringify(toBackendTree(content))
}

export function plainTextToBackendContent(text: string): string {
  return JSON.stringify(
    toBackendTree(
      plainTextToDoc(text),
    ),
  )
}

function ensureDoc(content: JSONContent): JSONContent {
  if (content.type === 'doc') {
    return {
      ...content,
      content: content.content?.length ? content.content : [{ type: 'paragraph' }],
    }
  }
  return {
    type: 'doc',
    content: [content],
  }
}

function plainTextToDoc(text: string): JSONContent {
  const lines = text.split(/\r?\n/)
  return {
    type: 'doc',
    content: (lines.length ? lines : ['']).map(line => ({
      type: 'paragraph',
      content: line ? [{ type: 'text', text: line }] : undefined,
    })),
  }
}

function fromBackendTree(tree: BackendTree): JSONContent {
  const blocks = (tree.children ?? []).map(nodeToEditorBlock)
  return {
    type: 'doc',
    content: blocks.length ? blocks : [{ type: 'paragraph' }],
  }
}

function nodeToEditorBlock(node: BackendNode): JSONContent {
  if (node.type === 'image') {
    return {
      type: 'image',
      attrs: node.attributes,
    }
  }

  const type = normalizeEditorBlockType(node.type)
  const text = node.text ?? ''
  const content = buildTextContent(text, node.formats ?? [])

  if (type === 'heading') {
    return {
      type,
      attrs: { level: headingLevel(node.type) },
      content,
    }
  }

  return {
    type,
    content,
  }
}

function buildTextContent(text: string, formats: BackendInlineFormat[]): JSONContent[] | undefined {
  if (!text) {
    return undefined
  }

  const boundaries = new Set<number>([0, text.length])
  for (const format of formats) {
    boundaries.add(clamp(format.offset, 0, text.length))
    boundaries.add(clamp(format.offset + format.length, 0, text.length))
  }

  const sorted = [...boundaries].sort((a, b) => a - b)
  const result: JSONContent[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]
    const end = sorted[i + 1]
    if (end <= start) continue

    const slice = text.slice(start, end)
    if (!slice) continue

    const marks = formats
      .filter(format => format.offset < end && format.offset + format.length > start)
      .flatMap(format => formatToMarks(format.attributes))

    result.push(marks.length ? { type: 'text', text: slice, marks } : { type: 'text', text: slice })
  }

  return result.length ? result : undefined
}

function formatToMarks(attributes: Record<string, unknown> | undefined): Array<{ type: string }> {
  if (!attributes) return []
  const marks: Array<{ type: string }> = []
  if (attributes.bold) marks.push({ type: 'bold' })
  if (attributes.italic) marks.push({ type: 'italic' })
  return marks
}

function toBackendTree(content: JSONContent): BackendTree {
  const doc = ensureDoc(content)
  return {
    children: (doc.content ?? []).map(blockToBackendNode),
  }
}

function blockToBackendNode(block: JSONContent): BackendNode {
  if (block.type === 'image') {
    return {
      type: 'image',
      attributes: block.attrs,
    }
  }

  const textNodes = flattenTextNodes(block.content ?? [])
  let cursor = 0
  const formats: BackendInlineFormat[] = []
  let text = ''

  for (const node of textNodes) {
    const value = node.text ?? ''
    if (!value) continue

    if (node.marks?.some(mark => mark.type === 'bold')) {
      formats.push({
        offset: cursor,
        length: value.length,
        attributes: { bold: true },
      })
    }
    if (node.marks?.some(mark => mark.type === 'italic')) {
      formats.push({
        offset: cursor,
        length: value.length,
        attributes: { italic: true },
      })
    }

    text += value
    cursor += value.length
  }

  return {
    type: normalizeBackendBlockType(block),
    text,
    formats,
    children: [],
  }
}

function flattenTextNodes(nodes: JSONContent[]): JSONContent[] {
  return nodes.flatMap(node => {
    if (node.type === 'text') {
      return [node]
    }
    return flattenTextNodes(node.content ?? [])
  })
}

function normalizeEditorBlockType(type: string | undefined): 'paragraph' | 'heading' {
  if (type?.startsWith('heading')) {
    return 'heading'
  }
  return 'paragraph'
}

function normalizeBackendBlockType(block: JSONContent): string {
  if (block.type === 'heading') {
    const level = Number(block.attrs?.level ?? 1)
    return `heading${clamp(level, 1, 3)}`
  }
  return 'paragraph'
}

function headingLevel(type: string | undefined): 1 | 2 | 3 {
  const level = Number(type?.replace('heading', '') ?? 1)
  if (level === 2 || level === 3) return level
  return 1
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
