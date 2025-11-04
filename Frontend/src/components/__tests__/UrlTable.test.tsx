import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UrlTable from '../UrlTable'
import * as client from '../../api/client'

// Mock the API client
vi.mock('../../api/client', () => ({
  listUrls: vi.fn(),
  deleteAlias: vi.fn()
}))

describe('UrlTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load and display URLs on mount', async () => {
    const mockUrls = [
      { alias: 'test1', fullUrl: 'https://example.com/1', shortUrl: 'http://localhost:8080/test1' },
      { alias: 'test2', fullUrl: 'https://example.com/2', shortUrl: 'http://localhost:8080/test2' }
    ]
    vi.mocked(client.listUrls).mockResolvedValue(mockUrls)

    render(<UrlTable />)

    await waitFor(() => {
      expect(client.listUrls).toHaveBeenCalledOnce()
    })

    expect(screen.getByText('test1')).toBeInTheDocument()
    expect(screen.getByText('test2')).toBeInTheDocument()
    expect(screen.getByText('https://example.com/1')).toBeInTheDocument()
    expect(screen.getByText('https://example.com/2')).toBeInTheDocument()
  })

  it('should display empty state when no URLs exist', async () => {
    vi.mocked(client.listUrls).mockResolvedValue([])

    render(<UrlTable />)

    await waitFor(() => {
      expect(screen.getByText('No URLs yet')).toBeInTheDocument()
    })
  })

  it('should display error message on load failure', async () => {
    const errorMessage = 'Failed to load URLs'
    vi.mocked(client.listUrls).mockRejectedValue(
      new (await import('../../types')).ApiError(errorMessage, 500)
    )

    render(<UrlTable />)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('should refresh list when refresh button is clicked', async () => {
    const mockUrls = [
      { alias: 'test1', fullUrl: 'https://example.com/1', shortUrl: 'http://localhost:8080/test1' }
    ]
    vi.mocked(client.listUrls).mockResolvedValue(mockUrls)

    const user = userEvent.setup()
    render(<UrlTable />)

    await waitFor(() => {
      expect(client.listUrls).toHaveBeenCalledOnce()
    })

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)

    await waitFor(() => {
      expect(client.listUrls).toHaveBeenCalledTimes(2)
    })
  })

  it('should show loading state during refresh', async () => {
    const mockUrls = [
      { alias: 'test1', fullUrl: 'https://example.com/1', shortUrl: 'http://localhost:8080/test1' }
    ]
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    vi.mocked(client.listUrls).mockReturnValueOnce(promise).mockResolvedValueOnce(mockUrls)

    const user = userEvent.setup()
    render(<UrlTable />)

    await waitFor(() => {
      expect(screen.getByText('test1')).toBeInTheDocument()
    })

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)

    await waitFor(() => {
      expect(screen.getByText('Refreshing…')).toBeInTheDocument()
      expect(refreshButton).toBeDisabled()
    })

    resolvePromise!(mockUrls)

    await waitFor(() => {
      expect(screen.queryByText('Refreshing…')).not.toBeInTheDocument()
    })
  })

  it('should delete URL when delete button is clicked', async () => {
    const mockUrls = [
      { alias: 'test1', fullUrl: 'https://example.com/1', shortUrl: 'http://localhost:8080/test1' },
      { alias: 'test2', fullUrl: 'https://example.com/2', shortUrl: 'http://localhost:8080/test2' }
    ]
    vi.mocked(client.listUrls).mockResolvedValue(mockUrls)
    vi.mocked(client.deleteAlias).mockResolvedValue(undefined)

    const user = userEvent.setup()
    render(<UrlTable />)

    await waitFor(() => {
      expect(screen.getByText('test1')).toBeInTheDocument()
      expect(screen.getByText('test2')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(client.deleteAlias).toHaveBeenCalledWith('test1')
      expect(screen.queryByText('test1')).not.toBeInTheDocument()
      expect(screen.getByText('test2')).toBeInTheDocument()
    })
  })

  it('should show loading state during delete', async () => {
    const mockUrls = [
      { alias: 'test1', fullUrl: 'https://example.com/1', shortUrl: 'http://localhost:8080/test1' }
    ]
    let resolvePromise: (value: any) => void
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    vi.mocked(client.listUrls).mockResolvedValue(mockUrls)
    vi.mocked(client.deleteAlias).mockReturnValue(promise)

    const user = userEvent.setup()
    render(<UrlTable />)

    await waitFor(() => {
      expect(screen.getByText('test1')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /delete test1/i })
    await user.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Deleting…')).toBeInTheDocument()
      expect(deleteButton).toBeDisabled()
    })

    resolvePromise!()

    await waitFor(() => {
      expect(screen.queryByText('Deleting…')).not.toBeInTheDocument()
      expect(screen.queryByText('test1')).not.toBeInTheDocument()
    })
  })

  it('should display error message on delete failure', async () => {
    const mockUrls = [
      { alias: 'test1', fullUrl: 'https://example.com/1', shortUrl: 'http://localhost:8080/test1' }
    ]
    const errorMessage = 'Failed to delete alias'
    vi.mocked(client.listUrls).mockResolvedValue(mockUrls)
    vi.mocked(client.deleteAlias).mockRejectedValue(
      new (await import('../../types')).ApiError(errorMessage, 404)
    )

    const user = userEvent.setup()
    render(<UrlTable />)

    await waitFor(() => {
      expect(screen.getByText('test1')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /delete test1/i })
    await user.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    // URL should still be in the list
    expect(screen.getByText('test1')).toBeInTheDocument()
  })

  it('should render table headers correctly', () => {
    vi.mocked(client.listUrls).mockResolvedValue([])

    render(<UrlTable />)

    expect(screen.getByText('Alias')).toBeInTheDocument()
    expect(screen.getByText('Full URL')).toBeInTheDocument()
    expect(screen.getByText('Short URL')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('should render short URLs as links', async () => {
    const mockUrls = [
      { alias: 'test1', fullUrl: 'https://example.com/1', shortUrl: 'http://localhost:8080/test1' }
    ]
    vi.mocked(client.listUrls).mockResolvedValue(mockUrls)

    render(<UrlTable />)

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'http://localhost:8080/test1' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'http://localhost:8080/test1')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })
})

