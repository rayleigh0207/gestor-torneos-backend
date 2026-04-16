import { Routes, Route, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast' // <-- 1. Importamos el Toaster
import Jugadores from './Jugadores'
import Torneos from './Torneos'
import TorneoDetalle from './TorneoDetalle' 

function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      
      
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            border: '1px solid #555',
          },
          success: {
            iconTheme: {
              primary: '#28a745',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#e53935',
              secondary: '#fff',
            },
          },
        }}
      />

      <nav style={{ padding: '15px 30px', backgroundColor: '#2a2a2a', borderBottom: '2px solid #646cff', display: 'flex', gap: '20px' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>Inicio (Torneos)</Link>
        <Link to="/jugadores" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>Jugadores</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Torneos />} />
        <Route path="/jugadores" element={<Jugadores />} />
        <Route path="/torneo/:id" element={<TorneoDetalle />} /> 
      </Routes>

    </div>
  )
}

export default App