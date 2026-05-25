import { useEffect, useState, useMemo } from 'react'
import { documentsApi } from '../api/documents'
import type { DocumentSaveHistory } from '../types/document'
import * as diffPackage from 'diff'

const diffWordsWithSpace = diffPackage.diffWordsWithSpace || (diffPackage as any).default?.diffWordsWithSpace || diffPackage.diffWords;

interface Props {
  documentId: string
  onClose: () => void
}

function extractRawText(json: any, imageMap: Map<string, string>, reverseImageMap: Map<string, string>): string {
  if (!json) return ''
  if (typeof json === 'string') return json
  
  let text = ''
  
  if (json.type === 'image' && json.attrs?.src) {
    const src = json.attrs.src;
    let id = reverseImageMap.get(src);
    if (!id) {
      id = `__IMG${imageMap.size}__`;
      imageMap.set(id, src);
      reverseImageMap.set(src, id);
    }
    text += ` ${id} `
  }
  
  if (typeof json.text === 'string') {
    text += json.text
  }
  
  const children = json.content || json.children || []
  if (Array.isArray(children)) {
    text += children.map((c: any) => extractRawText(c, imageMap, reverseImageMap)).join('')
  }
  
  if (json.type === 'paragraph' || json.type?.startsWith('heading')) {
    text += '\n'
  }
  
  if (!text && !json.type && !json.content && !json.children) {
    return JSON.stringify(json)
  }
  
  return text
}

function renderDiffText(text: string, imageMap: Map<string, string>) {
  const parts = text.split(/(__IMG\d+__)/g);
  return parts.map((part, i) => {
    if (part.startsWith('__IMG') && part.endsWith('__')) {
      const src = imageMap.get(part);
      if (src) {
        return <img key={i} src={src} alt="content" className="max-w-sm my-2 rounded shadow-sm border border-slate-200 inline-block" />
      }
    }
    return <span key={i}>{part}</span>
  })
}

export function SaveHistoryModal({ documentId, onClose }: Props) {
  const [historyList, setHistoryList] = useState<DocumentSaveHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    documentsApi.getSaveHistory(documentId)
      .then(res => setHistoryList(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [documentId])

  const diffResult = useMemo(() => {
    if (selectedIndex === null || !historyList[selectedIndex]) return null
    const currentEntry = historyList[selectedIndex]
    
    // Previous entry is at selectedIndex + 1 since list is sorted desc
    const prevEntry = historyList[selectedIndex + 1]
    
    const imageMap = new Map<string, string>()
    const reverseImageMap = new Map<string, string>()

    let currentText = ''
    try {
      currentText = extractRawText(JSON.parse(currentEntry.content), imageMap, reverseImageMap)
    } catch {
      currentText = currentEntry.content
    }

    let prevText = ''
    if (prevEntry) {
      try {
        prevText = extractRawText(JSON.parse(prevEntry.content), imageMap, reverseImageMap)
      } catch {
        prevText = prevEntry.content
      }
    }

    if (!prevEntry) {
      return { diffs: [{ value: currentText, added: false, removed: false }], imageMap }
    }

    return { diffs: diffWordsWithSpace(prevText, currentText), imageMap }
  }, [historyList, selectedIndex])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-full max-h-[80vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Sidebar */}
        <div className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col">
          <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Save History</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Loading...</div>
            ) : historyList.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No save history found.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {historyList.map((entry, idx) => (
                  <li 
                    key={entry.id} 
                    onClick={() => setSelectedIndex(idx)}
                    className={`cursor-pointer px-4 py-3 transition-colors ${selectedIndex === idx ? 'bg-blue-50' : 'hover:bg-slate-100'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-slate-800 text-sm">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Saved by: <span className="font-medium">{entry.actorName}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Version: {entry.serverVersion}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-3 bg-white shadow-sm">
            <h3 className="text-base font-semibold text-slate-800">
              {selectedIndex !== null ? `Changes on ${new Date(historyList[selectedIndex].createdAt).toLocaleString()}` : 'Select a version to view changes'}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {selectedIndex === null ? (
              <div className="flex h-full items-center justify-center text-slate-400">
                Select a version from the left panel.
              </div>
            ) : (
              <div className="prose max-w-none whitespace-pre-wrap font-sans text-slate-800">
                {diffResult?.diffs.map((part: any, i: number) => {
                  if (part.added) {
                    // New content
                    return <span key={i}>{renderDiffText(part.value, diffResult.imageMap)}</span>
                  }
                  if (part.removed) {
                    // Old content (bôi đỏ nhạt #fe9292)
                    return <span key={i} style={{ backgroundColor: '#fe9292', textDecoration: 'line-through' }} className="text-red-900">{renderDiffText(part.value, diffResult.imageMap)}</span>
                  }
                  return <span key={i}>{renderDiffText(part.value, diffResult.imageMap)}</span>
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
