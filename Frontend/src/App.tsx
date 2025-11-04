import ShortenForm from './components/ShortenForm'
import UrlTable from './components/UrlTable'

function App() {
  return (
    <div className="app">
      <header>
        <h1>URL Shortener</h1>
      </header>
      <main>
        <ShortenForm />
        <div className="section-gap" />
        <UrlTable />
      </main>
    </div>
  )
}

export default App

