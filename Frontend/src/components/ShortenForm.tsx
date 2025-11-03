import { useState, FormEvent } from 'react'
import { shortenUrl } from '../api/client'
import { ApiError } from '../types'

export default function ShortenForm() {
  const [fullUrl, setFullUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [shortUrl, setShortUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setShortUrl(null)
    setCopied(false)

    // Validate fullUrl
    if (!fullUrl.trim()) {
      setError('Full URL is required')
      return
    }

    if (!validateUrl(fullUrl.trim())) {
      setError('Please enter a valid URL (e.g., https://example.com)')
      return
    }

    setLoading(true)

    try {
      const response = await shortenUrl({
        fullUrl: fullUrl.trim(),
        customAlias: customAlias.trim() || undefined
      })
      setShortUrl(response.shortUrl)
      setFullUrl('')
      setCustomAlias('')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!shortUrl) return

    try {
      await navigator.clipboard.writeText(shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError('Failed to copy to clipboard')
    }
  }

  return (
    <div className="shorten-form">
      <h2>Shorten a URL</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fullUrl">
            Full URL <span className="required">*</span>
          </label>
          <input
            id="fullUrl"
            type="url"
            value={fullUrl}
            onChange={(e) => setFullUrl(e.target.value)}
            placeholder="https://example.com/very/long/url"
            disabled={loading}
            required
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'error-message' : undefined}
          />
        </div>

        <div className="form-group">
          <label htmlFor="customAlias">Custom Alias (optional)</label>
          <input
            id="customAlias"
            type="text"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
            placeholder="my-custom-alias"
            disabled={loading}
            aria-describedby="alias-help"
          />
          <small id="alias-help" className="help-text">
            Leave empty for auto-generated alias
          </small>
        </div>

        {error && (
          <div id="error-message" className="error-message" role="alert">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Shortening...' : 'Shorten URL'}
        </button>
      </form>

      {shortUrl && (
        <div className="result" role="status" aria-live="polite">
          <div className="result-label">Short URL:</div>
          <div className="result-url">
            <a href={shortUrl} target="_blank" rel="noopener noreferrer">
              {shortUrl}
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="copy-button"
              aria-label="Copy short URL to clipboard"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

