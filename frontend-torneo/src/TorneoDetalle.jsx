import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

/**
 * COMPONENTE: TorneoDetalle (Vista Administrativa)
 * DESCRIPCIÓN: Panel de control integral para la gestión de un torneo eSports/Deportivo.
 * FUNCIONALIDADES:
 * - Inscripción y control de participantes.
 * - Simulación de Fase de Liga Regular (Todos contra todos).
 * - Algoritmo de clasificación con diferencia de puntos y Top 4.
 * - Bracket visual dinámico e infinito (16avos, Octavos, Cuartos, Semis, Final).
 * - Cuadro de Honor (MVPs) y Podio de Clasificación Final.
 */
export default function TorneoDetalle() {
  const { id } = useParams() 
  const [torneo, setTorneo] = useState(null)
  const [todosLosJugadores, setTodosLosJugadores] = useState([])
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState('')
  const [partidos, setPartidos] = useState([])
  const [puntuaciones, setPuntuaciones] = useState({})

  /**
   * ==========================================
   * EFECTO INICIAL: CONEXIÓN AL BACKEND
   * ==========================================
   */
  const cargarDatosPantalla = async () => {
    try {
      const resJugadores = await fetch('http://localhost:8080/api/participantes')
      const dataJugadores = await resJugadores.json()
      setTodosLosJugadores(dataJugadores)

      const resTorneos = await fetch('http://localhost:8080/api/torneos')
      const dataTorneos = await resTorneos.json()
      const torneoEncontrado = dataTorneos.find(t => t.id === parseInt(id))
      setTorneo(torneoEncontrado)

      if (torneoEncontrado) {
        const resPartidos = await fetch('http://localhost:8080/api/partidos')
        const dataPartidos = await resPartidos.json()

        // Filtramos para aislar los partidos que corresponden a este ID
        const partidosDeEsteTorneo = dataPartidos.filter(partido => 
          partido.torneoId === parseInt(id)
        )
        
        setPartidos(partidosDeEsteTorneo)
      }
    } catch (error) {
      console.error("Error crítico al cargar los datos de la API:", error)
      toast.error("Error de conexión con el servidor")
    }
  }

  useEffect(() => {
    cargarDatosPantalla()
  }, [id])

  /**
   * ==========================================
   * LÓGICA DE GESTIÓN DE PARTICIPANTES
   * ==========================================
   */
  const inscribirJugador = (e) => {
    e.preventDefault()
    if (!jugadorSeleccionado) return

    fetch(`http://localhost:8080/api/torneos/${id}/inscribir/${jugadorSeleccionado}`, {
      method: 'POST'
    }).then(() => {
      setJugadorSeleccionado('')
      toast.success("Participante inscrito correctamente")
      cargarDatosPantalla() 
    })
  }

  const eliminarParticipante = (participanteId) => {
    if(!window.confirm("¿Estás seguro de que deseas retirar a este jugador del torneo actual?")) return;
    
    fetch(`http://localhost:8080/api/torneos/${id}/participante/${participanteId}`, {
      method: 'DELETE'
    }).then(() => {
      toast.success("Participante retirado del torneo")
      cargarDatosPantalla()
    });
  }

  const eliminarTorneo = () => {
    if(!window.confirm("⚠️ ADVERTENCIA: ¿Estás a punto de borrar este torneo de la base de datos de forma permanente. ¿Proceder?")) return;

    fetch(`http://localhost:8080/api/torneos/${id}`, {
      method: 'DELETE'
    }).then(() => {
      window.location.href = "/"; 
    });
  }
  
  /**
   * ==========================================
   * CONTROLADORES DE ESTADO DEL TORNEO
   * ==========================================
   */
  const arrancarTorneo = () => {
    fetch(`http://localhost:8080/api/torneos/${id}/generar-llaves`, {
      method: 'POST'
    })
    .then(res => res.text())
    .then(mensaje => {
      toast.success("¡Modalidad de Llaves Iniciada!")
      cargarDatosPantalla() 
    })
  }

  const arrancarLiga = () => {
    fetch(`http://localhost:8080/api/torneos/${id}/generar-liga`, {
      method: 'POST'
    })
    .then(res => res.text())
    .then(mensaje => {
      toast.success("¡Temporada Regular Iniciada!")
      cargarDatosPantalla() 
    })
  }

  const generarSiguienteRonda = () => {
    fetch(`http://localhost:8080/api/torneos/${id}/siguiente-ronda`, {
      method: 'POST'
    })
    .then(res => res.text())
    .then(mensaje => {
      if(mensaje.includes("CAMPEÓN")) {
        toast.success(mensaje, { duration: 6000, icon: '🏆' })
      } else {
        toast.success("Ronda generada y actualizada")
      }
      cargarDatosPantalla()
    })
  }

  const pasarAPlayoffs = () => {
    const top4Ids = tabla.slice(0, 4).map(jugador => jugador.id)

    if (top4Ids.length < 4) {
      toast.error("Se requiere un mínimo de 4 participantes para generar la fase final.")
      return
    }

    fetch(`http://localhost:8080/api/torneos/${id}/generar-playoffs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(top4Ids)
    })
    .then(res => res.text())
    .then(mensaje => {
      toast.success("¡Corte de Liga realizado! Playoffs Generados.")
      cargarDatosPantalla()
    })
  }

  /**
   * ==========================================
   * MOTOR DE PUNTUACIÓN Y ARBITRAJE
   * ==========================================
   */
  const manejarCambioPuntos = (partidoId, jugador, valor) => {
    setPuntuaciones(prev => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        [jugador]: parseInt(valor)
      }
    }))
  }

  const reportarResultadoConPuntos = (partidoId) => {
    const pts = puntuaciones[partidoId]
    if (!pts || pts.pts1 === undefined || pts.pts2 === undefined) {
      toast.error("Debes registrar la puntuación de ambos competidores.")
      return
    }

    fetch(`http://localhost:8080/api/partidos/${partidoId}/resultado?pts1=${pts.pts1}&pts2=${pts.pts2}`, {
      method: 'POST'
    }).then(() => {
      toast.success("Resultado oficial guardado")
      cargarDatosPantalla() 
    })
  }

  /**
   * ==========================================
   * ALGORITMO DE ESTADÍSTICAS Y TABLA DE LIGA
   * ==========================================
   */
  const obtenerTablaPosiciones = () => {
    if (!torneo || !torneo.participantes) return []

    let stats = {}
    torneo.participantes.forEach(p => {
      stats[p.id] = { 
        id: p.id, nombre: p.nombre, 
        pj: 0, pg: 0, pp: 0, pf: 0, pc: 0, dif: 0, pts: 0 
      }
    })

    partidos.forEach(p => {
      if (p.ganador && p.jugador1 && p.jugador2 && p.fase === "LIGA") {
        const id1 = p.jugador1.id
        const id2 = p.jugador2.id

        if (stats[id1] && stats[id2]) {
          stats[id1].pj += 1
          stats[id2].pj += 1

          if (p.ganador.id === id1) {
            stats[id1].pg += 1
            stats[id1].pts += 3
            stats[id2].pp += 1
          } else {
            stats[id2].pg += 1
            stats[id2].pts += 3
            stats[id1].pp += 1
          }

          if (p.puntuacionJugador1 !== null && p.puntuacionJugador2 !== null) {
            stats[id1].pf += p.puntuacionJugador1
            stats[id1].pc += p.puntuacionJugador2
            stats[id2].pf += p.puntuacionJugador2
            stats[id2].pc += p.puntuacionJugador1
          }
        }
      }
    })

    let tablaArr = Object.values(stats)
    tablaArr.forEach(s => s.dif = s.pf - s.pc)

    // Criterios de desempate: 1. Puntos Totales, 2. Diferencia a favor
    tablaArr.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts 
      return b.dif - a.dif 
    })

    return tablaArr
  }

  /**
   * ==========================================
   * MOTOR DE REBANADO DINÁMICO (BRACKET INFINITO)
   * ==========================================
   */
  const nombrarFaseMatematica = (cantidadPartidos) => {
    if (cantidadPartidos >= 16) return "16AVOS DE FINAL";
    if (cantidadPartidos >= 8) return "OCTAVOS DE FINAL";
    if (cantidadPartidos >= 4) return "CUARTOS DE FINAL";
    if (cantidadPartidos === 2) return "SEMIFINALES";
    if (cantidadPartidos === 1) return "LA GRAN FINAL";
    return `RONDA DE ${cantidadPartidos * 2}`;
  };

  const generarColumnasBracket = () => {
    let eliminatorias = partidos.filter(p => p.fase !== 'LIGA' && p.fase !== 'TERCER_LUGAR' && p.fase !== '3ER_LUGAR');
    eliminatorias.sort((a, b) => a.id - b.id); 
    
    let finales = eliminatorias.filter(p => p.fase === 'FINAL');
    let previas = eliminatorias.filter(p => p.fase !== 'FINAL');
    let columnas = [];

    if (previas.length > 0) {
      let sizeInicial = Math.pow(2, Math.floor(Math.log2(previas.length)));
      let restantes = [...previas];
      let currentSize = sizeInicial;

      while (restantes.length > 0 && currentSize >= 1) {
        let chunk = restantes.splice(0, currentSize);
        if (chunk.length > 0) {
          columnas.push({ nombre: nombrarFaseMatematica(chunk.length), partidos: chunk });
        }
        currentSize = currentSize / 2; 
      }
    }

    if (finales.length > 0) {
       columnas.push({ nombre: 'LA GRAN FINAL', partidos: finales, isFinal: true });
    }

    return columnas;
  };

  if (!torneo) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: '#888' }}>Cargando plataforma administrativa...</h2>

  // Variables de estado derivadas
  const cantidadInscritos = torneo.participantes ? torneo.participantes.length : 0;
  const listoParaEmpezar = torneo.estado === 'INSCRIPCION' && cantidadInscritos >= 2;
  const todosTienenGanador = partidos.length > 0 && partidos.every(p => p.ganador !== null);
  const tabla = obtenerTablaPosiciones();

  // Controladores de visibilidad
  const tienePartidosLiga = partidos.some(p => p.fase === 'LIGA');
  const tienePartidosEliminatoria = partidos.some(p => p.fase !== 'LIGA');
  
  // Generamos el bracket dinámico
  const columnasBracket = generarColumnasBracket();
  const partidosTercerLugar = partidos.filter(p => p.fase === 'TERCER_LUGAR' || p.fase === '3ER_LUGAR');

  // ==========================================
  // VARIABLES DEL PODIO Y CUADRO DE HONOR
  // ==========================================
  const mvpLiga = tabla.length > 0 ? tabla[0] : null;
  const partidoFinal = partidos.find(p => p.fase === 'FINAL') || (columnasBracket.length > 0 && columnasBracket[columnasBracket.length - 1].isFinal ? columnasBracket[columnasBracket.length - 1].partidos[0] : null);
  
  // Identificamos Oro y Plata
  const campeon = partidoFinal?.ganador;
  const subcampeon = partidoFinal?.ganador ? (partidoFinal.ganador.id === partidoFinal.jugador1?.id ? partidoFinal.jugador2 : partidoFinal.jugador1) : null;
  
  // Identificamos Bronce
  const partidoTercero = partidosTercerLugar.length > 0 ? partidosTercerLugar[0] : null;
  const tercerLugar = partidoTercero?.ganador;

  return (
    <div style={{ 
      padding: '30px', 
      maxWidth: '1200px', 
      margin: 'auto',
      fontFamily: 'Segoe UI, Helvetica, sans-serif'
    }}>
      
      {/* NAVEGACIÓN Y TÍTULO */}
      <Link to="/" style={{ color: '#aaa', textDecoration: 'none', fontWeight: '500' }}>⬅ Volver al Directorio de Torneos</Link>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: '25px',
        paddingBottom: '15px',
        borderBottom: '2px solid #333'
      }}>
        <h1 style={{ color: '#646cff', margin: 0, fontSize: '38px', letterSpacing: '-1px' }}>{torneo.nombre}</h1>
        <button 
          onClick={eliminarTorneo} 
          style={{ 
            backgroundColor: '#e53935', 
            color: 'white', 
            border: 'none', 
            padding: '12px 24px', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: '15px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}
        >
          🗑️ Eliminar Sistema
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginTop: '15px', color: '#aaa', fontSize: '16px' }}>
        <p><strong>Disciplina Activa:</strong> <span style={{ color: '#fff' }}>{torneo.juego}</span></p>
        <p><strong>Estado del Servidor:</strong> <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{torneo.estado}</span></p>
      </div>

      {/* ========================================== */}
      {/* SECCIÓN A: CUADRO DE HONOR Y PODIO FINAL   */}
      {/* ========================================== */}
      {torneo.estado === 'FINALIZADO' && (
        <div style={{ marginBottom: '50px', marginTop: '30px' }}>
          
          {/* Tarjetas de MVPs */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: tienePartidosLiga ? '1fr 1fr' : '1fr', 
            gap: '30px'
          }}>
            <div style={{ padding: '35px', backgroundColor: '#111', border: '3px solid #ffd700', borderRadius: '15px', textAlign: 'center', boxShadow: '0 0 30px rgba(255,215,0,0.15)' }}>
              <h3 style={{ color: '#ffd700', margin: '0 0 10px 0', letterSpacing: '2px' }}>🏆 CAMPEÓN DEFINITIVO</h3>
              <h2 style={{ margin: 0, fontSize: '32px', color: '#fff' }}>{campeon ? campeon.nombre : "Pendiente"}</h2>
              <p style={{ color: '#888', fontSize: '14px', marginTop: '8px' }}>Vencedor absoluto de la Gran Final</p>
            </div>
            
            {tienePartidosLiga && (
              <div style={{ padding: '35px', backgroundColor: '#111', border: '3px solid #007bff', borderRadius: '15px', textAlign: 'center', boxShadow: '0 0 30px rgba(0,123,255,0.15)' }}>
                <h3 style={{ color: '#007bff', margin: '0 0 10px 0', letterSpacing: '2px' }}>🌟 JUGADOR MÁS VALIOSO (LIGA)</h3>
                <h2 style={{ margin: 0, fontSize: '32px', color: '#fff' }}>{mvpLiga ? mvpLiga.nombre : "Pendiente"}</h2>
                <p style={{ color: '#888', fontSize: '14px', marginTop: '8px' }}>Líder indiscutible de la Temporada Regular</p>
              </div>
            )}
          </div>

          {/* TABLA DEL PODIO (NUEVO) */}
          <div style={{ marginTop: '30px', backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '15px', border: '1px solid #444', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
            <h3 style={{ textAlign: 'center', color: '#fff', letterSpacing: '1px', margin: '0 0 20px 0', fontSize: '24px' }}>🏅 Clasificación Final (Podio)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #555', color: '#aaa', fontSize: '14px' }}>
                  <th style={{ padding: '15px' }}>Puesto</th>
                  <th style={{ textAlign: 'left', padding: '15px' }}>Jugador / Atleta</th>
                  <th>Reconocimiento</th>
                </tr>
              </thead>
              <tbody>
                {campeon && (
                  <tr style={{ borderBottom: '1px solid #333', backgroundColor: 'rgba(255, 215, 0, 0.05)' }}>
                    <td style={{ padding: '15px', fontSize: '20px' }}>🥇 1ro</td>
                    <td style={{ textAlign: 'left', fontWeight: 'bold', fontSize: '20px', color: '#ffd700' }}>{campeon.nombre}</td>
                    <td style={{ color: '#ffd700', fontWeight: 'bold' }}>Campeón del Torneo</td>
                  </tr>
                )}
                {subcampeon && (
                  <tr style={{ borderBottom: '1px solid #333', backgroundColor: 'rgba(192, 192, 192, 0.05)' }}>
                    <td style={{ padding: '15px', fontSize: '20px' }}>🥈 2do</td>
                    <td style={{ textAlign: 'left', fontWeight: 'bold', fontSize: '18px', color: '#c0c0c0' }}>{subcampeon.nombre}</td>
                    <td style={{ color: '#c0c0c0' }}>Subcampeón</td>
                  </tr>
                )}
                {tercerLugar && (
                  <tr style={{ backgroundColor: 'rgba(205, 127, 50, 0.05)' }}>
                    <td style={{ padding: '15px', fontSize: '20px' }}>🥉 3ro</td>
                    <td style={{ textAlign: 'left', fontWeight: 'bold', fontSize: '18px', color: '#cd7f32' }}>{tercerLugar.nombre}</td>
                    <td style={{ color: '#cd7f32' }}>Tercer Lugar (Bronce)</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* SECCIÓN B: MÓDULO DE INSCRIPCIÓN           */}
      {/* ========================================== */}
      {torneo.estado === 'INSCRIPCION' && (
        <div style={{ 
          backgroundColor: '#1e1e1e', 
          padding: '30px', 
          borderRadius: '12px', 
          marginTop: '30px',
          border: '1px solid #444',
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ marginTop: 0, color: '#fff', fontSize: '20px', marginBottom: '20px' }}>Gestor de Integrantes</h3>
          <form onSubmit={inscribirJugador} style={{ display: 'flex', gap: '15px' }}>
            <select 
              value={jugadorSeleccionado} 
              onChange={e => setJugadorSeleccionado(e.target.value)}
              style={{ 
                padding: '15px', 
                flex: 1, 
                borderRadius: '8px', 
                cursor: 'pointer',
                backgroundColor: '#2a2a2a',
                color: 'white',
                border: '1px solid #555',
                fontSize: '16px'
              }}
              required
            >
              <option value="">-- Buscar talento en la base de datos global --</option>
              {todosLosJugadores
                .filter(j => !torneo.participantes.some(p => p.id === j.id)) 
                .map(j => (
                <option key={j.id} value={j.id}>{j.nombre} ({j.correo})</option>
              ))}
            </select>
            <button 
              type="submit" 
              style={{ 
                padding: '15px 40px', 
                backgroundColor: '#646cff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'background-color 0.3s'
              }}
            >
              Ingresar Talento
            </button>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* SECCIÓN C: INICIALIZADORES DE FLUJO        */}
      {/* ========================================== */}
      {listoParaEmpezar && (
        <div style={{ display: 'flex', gap: '20px', marginTop: '30px', marginBottom: '40px' }}>
          <button 
            onClick={arrancarTorneo} 
            style={{ flex: 1, padding: '22px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 5px 15px rgba(40,167,69,0.3)' }}
          >
            ▶ Iniciar Modalidad Llaves Directas
          </button>
          
          <button 
            onClick={arrancarLiga} 
            style={{ flex: 1, padding: '22px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 5px 15px rgba(0,123,255,0.3)' }}
          >
            🔄 Iniciar Modalidad Liga Extendida
          </button>
        </div>
      )}

      {/* ========================================== */}
      {/* SECCIÓN D: BRACKET VISUAL DINÁMICO E INFINITO*/}
      {/* ========================================== */}
      {tienePartidosEliminatoria && (
        <div style={{ marginTop: '50px', marginBottom: '80px' }}>
          <h2 style={{ textAlign: 'center', color: '#ffd700', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '40px' }}>
            🏁 Cuadro Oficial de Eliminatorias
          </h2>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-start', 
            alignItems: 'center', 
            padding: '60px 40px', 
            backgroundColor: '#0a0a0a', 
            borderRadius: '25px', 
            border: '1px solid #333', 
            overflowX: 'auto',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8)'
          }}>
            
            {/* RENDERIZADO DINÁMICO DE COLUMNAS */}
            {columnasBracket.map((columna, idx) => {
              const esUltimaColumna = idx === columnasBracket.length - 1;

              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                  
                  {/* COLUMNA ACTUAL */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '50px', justifyContent: 'center' }}>
                    <h3 style={{ textAlign: 'center', fontSize: '16px', color: esUltimaColumna ? '#ffd700' : '#888', letterSpacing: '2px', marginBottom: '10px', textShadow: esUltimaColumna ? '0 0 10px rgba(255,215,0,0.5)' : 'none' }}>
                      {columna.nombre}
                    </h3>
                    
                    {columna.partidos.map((partido) => (
                      <div key={partido.id} style={{ backgroundColor: '#1a1a1a', border: esUltimaColumna ? '2px solid #ffd700' : '1px solid #444', padding: '25px', borderRadius: '15px', textAlign: 'center', minWidth: '320px', boxShadow: esUltimaColumna ? '0 10px 25px rgba(255,215,0,0.15)' : '0 8px 16px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
                          <div style={{ flex: 1, fontWeight: 'bold', fontSize: '16px', color: partido.ganador?.id === partido.jugador1?.id ? '#28a745' : 'white' }}>
                            {partido.jugador1 ? partido.jugador1.nombre : 'Esperando Clasificado'}
                          </div>
                          <div style={{ color: '#e53935', fontWeight: '900', fontSize: '14px' }}>VS</div>
                          <div style={{ flex: 1, fontWeight: 'bold', fontSize: '16px', color: partido.ganador?.id === partido.jugador2?.id ? '#28a745' : 'white' }}>
                            {partido.jugador2 ? partido.jugador2.nombre : 'Esperando Clasificado'}
                          </div>
                        </div>

                        {!partido.ganador && partido.jugador1 && partido.jugador2 && (
                          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                            <input type="number" placeholder="Pts 1" onChange={(e) => manejarCambioPuntos(partido.id, 'pts1', e.target.value)} style={{ width: '65px', textAlign: 'center', padding: '10px', borderRadius: '6px', backgroundColor: '#111', color: 'white', border: '1px solid #555' }} />
                            <span style={{ color: '#888', fontWeight: 'bold' }}>-</span>
                            <input type="number" placeholder="Pts 2" onChange={(e) => manejarCambioPuntos(partido.id, 'pts2', e.target.value)} style={{ width: '65px', textAlign: 'center', padding: '10px', borderRadius: '6px', backgroundColor: '#111', color: 'white', border: '1px solid #555' }} />
                            <button onClick={() => reportarResultadoConPuntos(partido.id)} style={{ backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}>Validar 💾</button>
                          </div>
                        )}

                        {partido.ganador && (
                          <div style={{ marginTop: '15px', fontSize: '15px', color: '#28a745', fontWeight: 'bold', backgroundColor: '#1e301e', padding: '10px', borderRadius: '8px' }}>
                            Marcador Oficial: {partido.puntuacionJugador1} - {partido.puntuacionJugador2} {esUltimaColumna ? '🏆' : '✅'}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* DIBUJO DEL TERCER PUESTO (Solo aparece debajo de la Gran Final) */}
                    {esUltimaColumna && partidosTercerLugar.length > 0 && (
                      <div style={{ width: '100%', marginTop: '30px' }}>
                        <h3 style={{ textAlign: 'center', fontSize: '14px', color: '#cd7f32', letterSpacing: '1px', marginBottom: '15px' }}>DEFINICIÓN 3ER PUESTO</h3>
                        {partidosTercerLugar.map((partido) => (
                          <div key={partido.id} style={{ backgroundColor: '#222', border: '1px solid #cd7f32', padding: '20px', borderRadius: '12px', textAlign: 'center', minWidth: '320px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
                              <div style={{ flex: 1, fontWeight: 'bold', fontSize: '15px', color: partido.ganador?.id === partido.jugador1?.id ? '#28a745' : '#ccc' }}>{partido.jugador1 ? partido.jugador1.nombre : 'Esperando Rival'}</div>
                              <div style={{ color: '#e53935', fontWeight: '900', fontSize: '12px' }}>VS</div>
                              <div style={{ flex: 1, fontWeight: 'bold', fontSize: '15px', color: partido.ganador?.id === partido.jugador2?.id ? '#28a745' : '#ccc' }}>{partido.jugador2 ? partido.jugador2.nombre : 'Esperando Rival'}</div>
                            </div>
                            {!partido.ganador && partido.jugador1 && partido.jugador2 && (
                              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                <input type="number" placeholder="Pts 1" onChange={(e) => manejarCambioPuntos(partido.id, 'pts1', e.target.value)} style={{ width: '60px', textAlign: 'center', padding: '8px', borderRadius: '4px', backgroundColor: '#111', color: 'white', border: '1px solid #555' }} />
                                <span style={{ color: '#888' }}>-</span>
                                <input type="number" placeholder="Pts 2" onChange={(e) => manejarCambioPuntos(partido.id, 'pts2', e.target.value)} style={{ width: '60px', textAlign: 'center', padding: '8px', borderRadius: '4px', backgroundColor: '#111', color: 'white', border: '1px solid #555' }} />
                                <button onClick={() => reportarResultadoConPuntos(partido.id)} style={{ backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 15px', cursor: 'pointer', fontWeight: 'bold' }}>Validar 💾</button>
                              </div>
                            )}
                            {partido.ganador && (
                              <div style={{ marginTop: '12px', fontSize: '14px', color: '#cd7f32', fontWeight: 'bold', backgroundColor: '#3a2718', padding: '8px', borderRadius: '6px' }}>Bronce Asegurado: {partido.puntuacionJugador1} - {partido.puntuacionJugador2} 🥉</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* LÍNEA CONECTORA (Aparece después de cada columna generada dinámicamente, excepto la última) */}
                  {!esUltimaColumna && (
                    <div style={{ width: '60px', height: '4px', backgroundColor: '#444', margin: '0 30px', borderRadius: '2px' }}></div>
                  )}

                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SECCIÓN E: CLASIFICACIÓN GENERAL (SOLO SI HAY LIGA) */}
      {/* ========================================== */}
      {torneo.estado !== 'INSCRIPCION' && tienePartidosLiga && (
        <div style={{ marginTop: '50px' }}>
          {(tabla.length > 0) && (
            <div style={{ 
              marginBottom: '50px', 
              backgroundColor: '#1a1a1a', 
              padding: '40px', 
              borderRadius: '15px', 
              border: '1px solid #444', 
              boxShadow: '0 12px 24px rgba(0,0,0,0.5)' 
            }}>
              <h2 style={{ marginTop: 0, textAlign: 'center', color: '#007bff', marginBottom: '30px', fontSize: '28px' }}>
                📊 Clasificación General de Liga
              </h2>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #555', color: '#aaa', fontSize: '14px' }}>
                    <th style={{ padding: '20px' }}>Posición</th>
                    <th style={{ textAlign: 'left', padding: '20px' }}>Atleta / Participante</th>
                    <th>Juegos (PJ)</th>
                    <th>Victorias (PG)</th>
                    <th>Derrotas (PP)</th>
                    <th>A Favor (PF)</th>
                    <th>En Contra (PC)</th>
                    <th>Diferencial (DIF)</th>
                    <th style={{ color: '#fff', fontSize: '18px' }}>Puntos (PTS)</th>
                  </tr>
                </thead>
                <tbody>
                  {tabla.map((fila, index) => (
                    <tr key={fila.id} style={{ 
                      borderBottom: '1px solid #333',
                      backgroundColor: index < 4 ? 'rgba(156, 39, 176, 0.05)' : 'transparent' 
                    }}>
                      <td style={{ padding: '18px' }}>
                        {index < 4 ? <span style={{ color: '#9c27b0', fontWeight: '900', fontSize: '18px' }}>{index + 1}</span> : index + 1}
                      </td>
                      <td style={{ textAlign: 'left', fontWeight: 'bold', fontSize: '18px', color: index === 0 ? '#007bff' : 'white' }}>
                        {fila.nombre}
                      </td>
                      <td style={{ fontSize: '16px' }}>{fila.pj}</td>
                      <td style={{ color: '#28a745', fontWeight: 'bold', fontSize: '16px' }}>{fila.pg}</td>
                      <td style={{ color: '#e53935', fontWeight: 'bold', fontSize: '16px' }}>{fila.pp}</td>
                      <td style={{ fontSize: '16px', color: '#ccc' }}>{fila.pf}</td>
                      <td style={{ fontSize: '16px', color: '#ccc' }}>{fila.pc}</td>
                      
                      <td style={{ color: fila.dif >= 0 ? '#28a745' : '#e53935', fontWeight: 'bold', fontSize: '16px' }}>
                        {fila.dif > 0 ? `+${fila.dif}` : fila.dif}
                      </td>
                      <td style={{ fontWeight: '900', color: '#007bff', fontSize: '24px' }}>{fila.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* PANEL DE TRANSICIÓN: DE LIGA A PLAYOFFS */}
              {todosTienenGanador && torneo.estado === 'FASE_LIGA' && (
                 <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid #333', paddingTop: '30px' }}>
                   <div style={{ color: '#28a745', fontWeight: '900', fontSize: '22px', marginBottom: '20px' }}>
                     ¡Sistema de Liga Completado! Líder en Solitario: {tabla[0].nombre} 🏆
                   </div>
                   <button 
                     onClick={pasarAPlayoffs} 
                     style={{ 
                       padding: '20px 50px', 
                       backgroundColor: '#9c27b0', 
                       color: 'white', 
                       border: 'none', 
                       borderRadius: '10px', 
                       cursor: 'pointer', 
                       fontWeight: 'bold', 
                       fontSize: '20px', 
                       boxShadow: '0 8px 20px rgba(156, 39, 176, 0.5)',
                       transition: 'transform 0.2s'
                     }}
                   >
                     ⚔️ Procesar Corte y Generar Playoffs (Top 4)
                   </button>
                 </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* BOTÓN MAESTRO DE AVANCE DE RONDA */}
      {todosTienenGanador && partidos.length > 0 && torneo.estado !== 'FINALIZADO' && (
        <button 
          onClick={generarSiguienteRonda} 
          style={{ 
            width: '100%', 
            marginBottom: '50px', 
            padding: '25px', 
            backgroundColor: '#ff9800', 
            color: 'white', 
            border: 'none', 
            borderRadius: '12px', 
            cursor: 'pointer', 
            fontWeight: '900', 
            fontSize: '22px',
            boxShadow: '0 8px 15px rgba(255, 152, 0, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          ⚡ Validar Auditoría y Procesar Siguiente Fase
        </button>
      )}

      {/* ========================================== */}
      {/* SECCIÓN F: HISTORIAL DE PARTIDOS DE LIGA   */}
      {/* ========================================== */}
      {tienePartidosLiga && (
        <>
          <h2 style={{ borderLeft: '6px solid #007bff', paddingLeft: '20px', marginBottom: '30px', fontSize: '28px' }}>
            ⚔️ Auditoría de Encuentros (Fase Regular)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '25px' }}>
            
            {partidos.filter(p => p.fase === 'LIGA').map((partido, index) => (
              <div key={partido.id} style={{ backgroundColor: '#222', border: '1px solid #444', padding: '25px', borderRadius: '12px', textAlign: 'center', transition: 'transform 0.2s' }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Encuentro Oficial #{index + 1}
                </h4>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
                  <div style={{ flex: 1, fontWeight: 'bold', fontSize: '16px', color: partido.ganador?.id === partido.jugador1?.id ? '#28a745' : 'white' }}>
                    {partido.jugador1 ? partido.jugador1.nombre : '???'}
                  </div>
                  <div style={{ color: '#e53935', fontWeight: '900', fontSize: '14px' }}>VS</div>
                  <div style={{ flex: 1, fontWeight: 'bold', fontSize: '16px', color: partido.ganador?.id === partido.jugador2?.id ? '#28a745' : 'white' }}>
                    {partido.jugador2 ? partido.jugador2.nombre : '???'}
                  </div>
                </div>

                {!partido.ganador && partido.jugador1 && partido.jugador2 && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    <input 
                      type="number" 
                      placeholder="Puntos J1" 
                      onChange={(e) => manejarCambioPuntos(partido.id, 'pts1', e.target.value)} 
                      style={{ width: '70px', textAlign: 'center', padding: '8px', borderRadius: '6px', backgroundColor: '#111', color: 'white', border: '1px solid #555' }} 
                    />
                    <span style={{ color: '#666', fontWeight: 'bold' }}>-</span>
                    <input 
                      type="number" 
                      placeholder="Puntos J2" 
                      onChange={(e) => manejarCambioPuntos(partido.id, 'pts2', e.target.value)} 
                      style={{ width: '70px', textAlign: 'center', padding: '8px', borderRadius: '6px', backgroundColor: '#111', color: 'white', border: '1px solid #555' }} 
                    />
                    <button 
                      onClick={() => reportarResultadoConPuntos(partido.id)} 
                      style={{ backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Cargar 💾
                    </button>
                  </div>
                )}

                {partido.ganador && (
                  <div style={{ marginTop: '15px', fontSize: '15px', color: '#28a745', fontWeight: 'bold', backgroundColor: '#1e301e', padding: '8px', borderRadius: '6px', border: '1px solid #28a745' }}>
                    Validado: {partido.puntuacionJugador1} - {partido.puntuacionJugador2} ✅
                  </div>
                )}
              </div>
            ))}

          </div>
        </>
      )}

      {/* ========================================== */}
      {/* SECCIÓN G: DIRECTORIO DE INSCRITOS         */}
      {/* ========================================== */}
      {torneo.estado === 'INSCRIPCION' && (
        <div style={{ marginTop: '60px' }}>
          <h3 style={{ marginBottom: '25px', borderBottom: '2px solid #333', paddingBottom: '15px', fontSize: '24px' }}>
            Directorio de Participantes ({cantidadInscritos})
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {torneo.participantes.map(p => (
              <div key={p.id} style={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #444', 
                padding: '20px', 
                borderRadius: '12px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{p.nombre}</span>
                <button 
                  onClick={() => eliminarParticipante(p.id)} 
                  style={{ 
                    background: '#2a1111', 
                    border: '1px solid #e53935', 
                    color: '#e53935', 
                    cursor: 'pointer', 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    padding: '5px 10px',
                    borderRadius: '6px'
                  }}
                >
                  Expulsar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}