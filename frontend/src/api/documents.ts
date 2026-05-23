import { apiClient } from './client'
import type { Document, DocumentPage, DocumentScope, Visibility } from '../types/document'
import type { OperationHistoryPage } from '../types/collaboration'

export interface CreateDocumentBody { title: string; visibility: Visibility; content?: string }
export interface UpdateDocumentBody { title?: string; visibility?: Visibility; content?: string }

export const documentsApi = {
  list: (scope: DocumentScope, params?: { query?: string; page?: number; size?: number }) =>
    apiClient.get<DocumentPage>('/documents', { params: { scope, ...params } }).then(r => r.data),

  get: (id: string) =>
    apiClient.get<Document>(`/documents/${id}`).then(r => r.data),

  create: (body: CreateDocumentBody) =>
    apiClient.post<Document>('/documents', body).then(r => r.data),

  update: (id: string, body: UpdateDocumentBody) =>
    apiClient.put<Document>(`/documents/${id}`, body).then(r => r.data),

  getOperations: (id: string, params?: { sinceVersion?: number; limit?: number }) =>
    apiClient
      .get<OperationHistoryPage>(`/documents/${id}/operations`, { params })
      .then(r => r.data),

  getSaveHistory: (id: string) =>
    apiClient.get<import('../types/document').DocumentSaveHistory[]>(`/documents/${id}/save-history`).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/documents/${id}`),
}
