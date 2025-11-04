import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShortenForm from '../ShortenForm'
import * as client from '../../api/client'

// Mock the API client
vi.mock('../../api/client', () => ({
  shortenUrl: vi.fn()
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
})

describe('ShortenForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form with inputs and submit button', () => {
    render(<ShortenForm />)

    expect(screen.getByLabelText(/full url/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/custom alias/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /shorten url/i })).toBeInTheDocument()
  })

  it('should show validation error for empty URL', async () => {
    const user = userEvent.setup()
    render(<ShortenForm />)

    const submitButton = screen.getByRole('button', { name: /shorten url/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Full URL is required')).toBeInTheDocument()
    })
  })

  it('should show validation error for invalid URL', async () => {
    const user = userEvent.setup()
    render(<ShortenForm />)

    const urlInput = screen.getByLabelText(/full url/i)
    await user.type(urlInput, 'not-a-valid-url')
    await user.click(screen.getByRole('button', { name: /shorten url/i }))

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument()
    })
  })

  it('should successfully shorten URL and display result', async () => {
    const user = userEvent.setup()
    const mockResponse = { shortUrl: 'http://localhost:8080/test-alias' }
    vi.mocked(client.shortenUrl).mockResolvedValue(mockResponse)

    render(<ShortenForm />)

    const urlInput = screen.getByLabelText(/full url/i)
    await user.type(urlInput, 'https://example.com')
    await user.click(screen.getByRole('button', { name: /shorten url/i }))

    await waitFor(() => {
      expect(client.shortenUrl).toHaveBeenCalledWith({
        fullUrl: 'https://example.com',
        customAlias: undefined
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/short url:/i)).toBeInTheDocument()
      expect(screen.getByText(mockResponse.shortUrl)).toBeInTheDocument()
    })

    // Form should be cleared
    expect(urlInput).toHaveValue('')
  })

  it('should include custom alias when provided', async () => {
    const user = userEvent.setup()
    const mockResponse = { shortUrl: 'http://localhost:8080/my-alias' }
    vi.mocked(client.shortenUrl).mockResolvedValue(mockResponse)

    render(<ShortenForm />)

    await user.type(screen.getByLabelText(/full url/i), 'https://example.com')
    await user.type(screen.getByLabelText(/custom alias/i), 'my-alias')
    await user.click(screen.getByRole('button', { name: /shorten url/i }))

    await waitFor(() => {
      expect(client.shortenUrl).toHaveBeenCalledWith({
        fullUrl: 'https://example.com',
        customAlias: 'my-alias'
      })
    })
  })

  it('should display error message on API error', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Alias already exists'
    vi.mocked(client.shortenUrl).mockRejectedValue(
      new (await import('../../types')).ApiError(errorMessage, 400)
    )

    render(<ShortenForm />)

    await user.type(screen.getByLabelText(/full url/i), 'https://example.com')
    await user.type(screen.getByLabelText(/custom alias/i), 'existing')
    await user.click(screen.getByRole('button', { name: /shorten url/i }))

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    vi.mocked(client.shortenUrl).mockReturnValue(promise)

    render(<ShortenForm />)

    await user.type(screen.getByLabelText(/full url/i), 'https://example.com')
    const submitButton = screen.getByRole('button', { name: /shorten url/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Shortening...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    resolvePromise!({ shortUrl: 'http://localhost:8080/test' })
    await waitFor(() => {
      expect(screen.queryByText('Shortening...')).not.toBeInTheDocument()
    })
  })

  it('should copy short URL to clipboard', async () => {
    const user = userEvent.setup()
    const mockResponse = { shortUrl: 'http://localhost:8080/test-alias' }
    vi.mocked(client.shortenUrl).mockResolvedValue(mockResponse)

    render(<ShortenForm />)

    await user.type(screen.getByLabelText(/full url/i), 'https://example.com')
    await user.click(screen.getByRole('button', { name: /shorten url/i }))

    await waitFor(() => {
      expect(screen.getByText(mockResponse.shortUrl)).toBeInTheDocument()
    })

    const copyButton = screen.getByRole('button', { name: /copy/i })
    await user.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockResponse.shortUrl)

    await waitFor(() => {
      expect(screen.getByText('✓ Copied')).toBeInTheDocument()
    })
  })

  it('should handle clipboard copy error', async () => {
    const user = userEvent.setup()
    const mockResponse = { shortUrl: 'http://localhost:8080/test-alias' }
    vi.mocked(client.shortenUrl).mockResolvedValue(mockResponse)
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Clipboard error'))

    render(<ShortenForm />)

    await user.type(screen.getByLabelText(/full url/i), 'https://example.com')
    await user.click(screen.getByRole('button', { name: /shorten url/i }))

    await waitFor(() => {
      expect(screen.getByText(mockResponse.shortUrl)).toBeInTheDocument()
    })

    const copyButton = screen.getByRole('button', { name: /copy/i })
    await user.click(copyButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to copy to clipboard')).toBeInTheDocument()
    })
  })

  it('should trim whitespace from inputs', async () => {
    const user = userEvent.setup()
    const mockResponse = { shortUrl: 'http://localhost:8080/test' }
    vi.mocked(client.shortenUrl).mockResolvedValue(mockResponse)

    render(<ShortenForm />)

    await user.type(screen.getByLabelText(/full url/i), '  https://example.com  ')
    await user.type(screen.getByLabelText(/custom alias/i), '  my-alias  ')
    await user.click(screen.getByRole('button', { name: /shorten url/i }))

    await waitFor(() => {
      expect(client.shortenUrl).toHaveBeenCalledWith({
        fullUrl: 'https://example.com',
        customAlias: 'my-alias'
      })
    })
  })
})

