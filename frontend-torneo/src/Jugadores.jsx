import { useState, useEffect } from 'react'

export default function Jugadores() {
  const [jugadores, setJugadores] = useState([])
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')

  // Pedir los jugadores al backend (Java)
  const cargarJugadores = () => {
    fetch('http://localhost:8080/api/participantes')
      .then(res => res.json())
      .then(data => setJugadores(data))
      .catch(err => console.error(err))
  }

  // Cargar la lista apenas se abre la pantalla
  useEffect(() => {
    cargarJugadores()
  }, [])

  // Enviar un jugador nuevo a la base de datos
  const registrarJugador = (e) => {
    e.preventDefault()
    const nuevoJugador = { nombre: nombre, correo: correo }

    fetch('http://localhost:8080/api/participantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoJugador)
    }).then(() => {
      setNombre('') // Limpiar cajas de texto
      setCorreo('')
      cargarJugadores() // Recargar la lista
    })
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h2>🎮 Registro de Jugadores</h2>
      
      {/* Formulario oscuro */}
      <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <form onSubmit={registrarJugador} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Nombre (Ej: Ryan GS)" 
            value={nombre} 
            onChange={e => setNombre(e.target.value)} 
            required 
            style={{ padding: '10px', flex: 1, borderRadius: '4px', border: 'none' }} 
          />
          <input 
            type="email" 
            placeholder="Correo electrónico" 
            value={correo} 
            onChange={e => setCorreo(e.target.value)} 
            required 
            style={{ padding: '10px', flex: 1, borderRadius: '4px', border: 'none' }} 
          />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#646cff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Registrar
          </button>
        </form>
      </div>

      {/* Lista de Jugadores desde PostgreSQL */}
      <h3>Jugadores Registrados ({jugadores.length})</h3>
      <div style={{ display: 'grid', gap: '10px' }}>
        {jugadores.map(j => (
          <div key={j.id} style={{ backgroundColor: '#1a1a1a', border: '1px solid #444', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold', color: '#646cff' }}>{j.nombre}</span>
            <span style={{ color: '#aaa' }}>{j.correo}</span>
          </div>
        ))}
      </div>
    </div>
  )
}