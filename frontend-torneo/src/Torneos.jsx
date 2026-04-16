import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom' // <-- 1. Agregamos esto aquí arriba

export default function Torneos() {
  const [torneos, setTorneos] = useState([])
  const [nombre, setNombre] = useState('')
  const [juego, setJuego] = useState('')

  // Cargar torneos desde el backend
  const cargarTorneos = () => {
    fetch('http://localhost:8080/api/torneos')
      .then(res => res.json())
      .then(data => setTorneos(data))
      .catch(err => console.error(err))
  }

  useEffect(() => {
    cargarTorneos()
  }, [])

  // Guardar un nuevo torneo
  const crearTorneo = (e) => {
    e.preventDefault()
    const nuevoTorneo = { nombre: nombre, juego: juego }

    fetch('http://localhost:8080/api/torneos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoTorneo)
    }).then(() => {
      setNombre('')
      setJuego('')
      cargarTorneos() 
    })
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h2>🏆 Gestión de Torneos</h2>
      
      <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <form onSubmit={crearTorneo} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Nombre del torneo (Ej: Copa Celta)" 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            style={{ padding: '10px', flex: 1, borderRadius: '4px', border: 'none' }}
          />
          <input 
            type="text" 
            placeholder="Juego (Ej: FC 25)" 
            value={juego}
            onChange={(e) => setJuego(e.target.value)}
            required
            style={{ padding: '10px', flex: 1, borderRadius: '4px', border: 'none' }}
          />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#646cff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Crear Torneo
          </button>
        </form>
      </div>

      <h3>Torneos Activos</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {torneos.map(torneo => (
          <div key={torneo.id} style={{ border: '1px solid #646cff', padding: '20px', borderRadius: '8px', backgroundColor: '#1a1a1a' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#646cff' }}>{torneo.nombre}</h3>
            <p style={{ margin: '5px 0' }}><strong>Juego:</strong> {torneo.juego}</p>
            <p style={{ margin: '5px 0' }}><strong>Estado:</strong> {torneo.estado}</p>
            <p style={{ margin: '5px 0' }}><strong>Inscritos:</strong> {torneo.participantes ? torneo.participantes.length : 0}</p>
            
            {/* <-- 2. Y agregamos este botón aquí abajo --> */}
            <Link to={`/torneo/${torneo.id}`} style={{ display: 'inline-block', marginTop: '10px', padding: '8px 15px', backgroundColor: '#444', color: 'white', textDecoration: 'none', borderRadius: '4px', textAlign: 'center' }}>
              Ver Torneo / Inscribir
            </Link>

          </div>
        ))}
      </div>
    </div>
  )
}