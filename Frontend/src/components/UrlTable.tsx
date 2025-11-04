import { useEffect, useState } from 'react'
import { deleteAlias, listUrls } from '../api/client'
import { ApiError, UrlItem } from '../types'

export default function UrlTable() {
  const [items, setItems] = useState<UrlItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listUrls()
      setItems(data)
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Failed to load URLs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onDelete = async (alias: string) => {
    setDeleting((prev) => ({ ...prev, [alias]: true }))
    setError(null)
    try {
      await deleteAlias(alias)
      setItems((prev) => prev.filter((i) => i.alias !== alias))
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Failed to delete alias')
    } finally {
      setDeleting((prev) => ({ ...prev, [alias]: false }))
    }
  }

  return (
    <section className="url-table">
      <div className="table-header">
        <h2>All Shortened URLs</h2>
        <button className="secondary-button" onClick={load} disabled={loading} aria-label="Refresh list">
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Alias</th>
              <th>Full URL</th>
              <th>Short URL</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading ? (
              <tr>
                <td colSpan={4} className="empty">No URLs yet</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.alias}>
                  <td><code>{item.alias}</code></td>
                  <td className="truncate" title={item.fullUrl}>{item.fullUrl}</td>
                  <td className="truncate">
                    <a href={item.shortUrl} target="_blank" rel="noopener noreferrer">{item.shortUrl}</a>
                  </td>
                  <td>
                    <button
                      className="danger-button"
                      onClick={() => onDelete(item.alias)}
                      disabled={!!deleting[item.alias]}
                      aria-label={`Delete ${item.alias}`}
                    >
                      {deleting[item.alias] ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}


