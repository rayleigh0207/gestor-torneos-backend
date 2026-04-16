package com.example.demo.controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Participante;
import com.example.demo.model.Partido;
import com.example.demo.model.Torneo;
import com.example.demo.repository.ParticipanteRepository;
import com.example.demo.repository.PartidoRepository;
import com.example.demo.repository.TorneoRepository;

@RestController
@RequestMapping("/api/torneos")
@CrossOrigin("*") 
public class TorneoController {

    @Autowired
    private TorneoRepository torneoRepository;
    
    @Autowired
    private ParticipanteRepository participanteRepository;
    
    @Autowired
    private PartidoRepository partidoRepository;

    // Crear un nuevo torneo (POST)
    @PostMapping
    public Torneo crearTorneo(@RequestBody Torneo torneo) {
        torneo.setEstado("INSCRIPCION"); 
        return torneoRepository.save(torneo);
    }

    // Ver todos los torneos (GET)
    @GetMapping
    public List<Torneo> obtenerTorneos() {
        return torneoRepository.findAll();
    }
    
    @PostMapping("/{torneoId}/inscribir/{participanteId}")
	public Torneo inscribirParticipante(@PathVariable Long torneoId, @PathVariable Long participanteId) {
		
		Torneo torneo = torneoRepository.findById(torneoId).orElse(null);
		Participante participante = participanteRepository.findById(participanteId).orElse(null);
		
		if (torneo != null && participante != null) {
			// NUEVO: Verificamos si el jugador ya está adentro
			boolean yaInscrito = torneo.getParticipantes().stream()
					.anyMatch(p -> p.getId().equals(participanteId));
			
			// Solo lo agregamos si NO está inscrito
			if (!yaInscrito) {
				torneo.getParticipantes().add(participante);
				return torneoRepository.save(torneo);
			}
		}
		
		return torneo; // Retornamos el torneo sin cambios si ya estaba
	}
    
    @PostMapping("/{torneoId}/generar-llaves")
    public String generarLlaves(@PathVariable Long torneoId) {
    	Torneo torneo = torneoRepository.findById(torneoId).orElse(null);
    	
    	if (torneo == null || !torneo.getEstado().equals("INSCRIPCION")) {
    		return "Error: Se necesitan al menos 2 jugadores para iniciar.";
    	}
    	List<Participante> jugadores = torneo.getParticipantes();
    	if (jugadores.size() < 2) {
    		return "Error: Se necesitan al menos 2 jugadores para iniciar.";
    	}
    	
    	java.util.Collections.shuffle(jugadores);
    	
    	for (int i = 0; i < jugadores.size(); i += 2) {
    		Partido partido = new Partido();
    		partido.setTorneoId(torneo.getId());
    		partido.setJugador1(jugadores.get(i));
    		partido.setTorneo(torneo);
    		partido.setRonda(1);
    		partido.setJugador1(jugadores.get(i));
    		
    		if (i + 1 < jugadores.size()) {
    			partido.setJugador2(jugadores.get(i + 1));
    		}
    		
    		partidoRepository.save(partido);
    	}
    	
    	torneo.setEstado("EN_CURSO");
    	torneoRepository.save(torneo);
    	
    	return "¡Llaves generadas con éxito! El torneo ha comenzado.";
    }
    
 
 	@PostMapping("/{id}/generar-liga")
 	public String generarLiga(@PathVariable Long id) {
 		Torneo torneo = torneoRepository.findById(id).orElse(null);
 		
 		if (torneo == null) return "Torneo no encontrado";
 		if (torneo.getParticipantes().size() < 2) return "Se necesitan al menos 2 jugadores";

 		List<Participante> jugadores = torneo.getParticipantes();

 		// Algoritmo: Doble ciclo para emparejar a todos contra todos exactamente 1 vez
 		for (int i = 0; i < jugadores.size(); i++) {
 			for (int j = i + 1; j < jugadores.size(); j++) {
 				Partido partido = new Partido();
 				partido.setJugador1(jugadores.get(i));
 				partido.setJugador2(jugadores.get(j));
 				partido.setTorneoId(torneo.getId());
 				partido.setFase("LIGA"); // Marcamos que este partido es de liga
 				
 				partidoRepository.save(partido);
 			}
 		}

 		// Cambiamos el estado del torneo
 		torneo.setEstado("FASE_LIGA");
 		torneoRepository.save(torneo);

 		return "¡Fase de Liga generada con éxito! Todos contra todos.";
 	}
 	

 	@PostMapping("/{id}/generar-playoffs")
 	public String generarPlayoffs(@PathVariable Long id, @RequestBody List<Long> clasificadosIds) {
 		Torneo torneo = torneoRepository.findById(id).orElse(null);
 		if (torneo == null) return "Torneo no encontrado";
 		
 		int n = clasificadosIds.size();
 		
 		// Lógica de emparejamiento clásico de Playoffs (1ro vs Último, 2do vs Penúltimo...)
 		for (int i = 0; i < n / 2; i++) {
 			Long idJugador1 = clasificadosIds.get(i);
 			Long idJugador2 = clasificadosIds.get(n - 1 - i);
 			
 			Participante j1 = participanteRepository.findById(idJugador1).orElse(null);
 			Participante j2 = participanteRepository.findById(idJugador2).orElse(null);
 			
 			Partido partido = new Partido();
 			partido.setJugador1(j1);
 			partido.setJugador2(j2);
 			partido.setTorneoId(torneo.getId());
 			partido.setFase("PLAYOFFS"); // Marcamos que son partidos de eliminación directa
 			
 			partidoRepository.save(partido);
 		}

 		// Cambiamos el estado para que React sepa que ya salimos de la liga
 		torneo.setEstado("PLAYOFFS"); 
 		torneoRepository.save(torneo);

 		return "¡Playoffs generados! El Top " + n + " se enfrentará en eliminación directa.";
 	}
    
 	@PostMapping("/{torneoId}/siguiente-ronda")
	public String siguienteRonda(@PathVariable Long torneoId) {
		Torneo torneo = torneoRepository.findById(torneoId).orElse(null);
		if (torneo == null) return "Torneo no encontrado";

		if (torneo.getEstado().equals("FINALIZADO")) {
			return "El torneo ya ha finalizado.";
		}

		List<Partido> partidosEliminatoria = partidoRepository.findAll().stream()
				.filter(p -> p.getTorneoId() != null && p.getTorneoId().equals(torneoId))
				.filter(p -> !"LIGA".equals(p.getFase())) 
				.collect(Collectors.toList());

		if (partidosEliminatoria.isEmpty()) {
			return "Error: No hay partidos de llaves o playoffs activos.";
		}

		boolean todosTerminados = partidosEliminatoria.stream().allMatch(p -> p.getGanador() != null);
		if (!todosTerminados) {
			return "Error: Aún hay partidos sin terminar en esta ronda.";
		}

		// =============================================================
		// PRIORIDAD MÁXIMA: SI LA GRAN FINAL TERMINÓ, TENEMOS CAMPEÓN
		// =============================================================
		java.util.Optional<Partido> granFinal = partidosEliminatoria.stream()
				.filter(p -> "FINAL".equals(p.getFase()))
				.findFirst();

		if (granFinal.isPresent() && granFinal.get().getGanador() != null) {
			Participante campeonReal = granFinal.get().getGanador();
			torneo.setEstado("FINALIZADO");
			torneoRepository.save(torneo);
			return "¡TENEMOS UN CAMPEÓN! 🏆 " + campeonReal.getNombre();
		}

		// Si no hay final o no ha terminado, seguimos con la lógica de avanzar rondas
		long maxJugados = 0;
		for (Participante p : torneo.getParticipantes()) {
			long jugados = partidosEliminatoria.stream().filter(m -> 
				(m.getJugador1() != null && m.getJugador1().getId().equals(p.getId())) || 
				(m.getJugador2() != null && m.getJugador2().getId().equals(p.getId()))
			).count();
			if (jugados > maxJugados) maxJugados = jugados;
		}

		List<Participante> clasificados = new ArrayList<>();
		List<Participante> perdedoresSemi = new ArrayList<>();
		
		for (Participante p : torneo.getParticipantes()) {
			long jugados = partidosEliminatoria.stream().filter(m -> 
				(m.getJugador1() != null && m.getJugador1().getId().equals(p.getId())) || 
				(m.getJugador2() != null && m.getJugador2().getId().equals(p.getId()))
			).count();

			long ganados = partidosEliminatoria.stream().filter(m -> 
				m.getGanador() != null && m.getGanador().getId().equals(p.getId())
			).count();

			if (jugados > 0 && jugados == ganados && jugados == maxJugados) {
				clasificados.add(p);
			} 
			else if (jugados > 0 && jugados == maxJugados && ganados == maxJugados - 1) {
				perdedoresSemi.add(p);
			}
		}

		// Emparejamos para la siguiente fase (Final y 3er Lugar)
		Collections.shuffle(clasificados);
		for (int i = 0; i < clasificados.size(); i += 2) {
			Partido nuevoPartido = new Partido();
			nuevoPartido.setTorneoId(torneo.getId());
			nuevoPartido.setJugador1(clasificados.get(i));
			
			if (clasificados.size() == 2) {
				nuevoPartido.setFase("FINAL");
			} else {
				nuevoPartido.setFase(torneo.getEstado().equals("PLAYOFFS") ? "PLAYOFFS" : null);
			}

			if (i + 1 < clasificados.size()) {
				nuevoPartido.setJugador2(clasificados.get(i + 1));
			}
			partidoRepository.save(nuevoPartido);
		}
		
		if (clasificados.size() == 2 && perdedoresSemi.size() == 2) {
			Partido partidoTercerLugar = new Partido();
			partidoTercerLugar.setTorneoId(torneo.getId());
			partidoTercerLugar.setJugador1(perdedoresSemi.get(0));
			partidoTercerLugar.setJugador2(perdedoresSemi.get(1));
			partidoTercerLugar.setFase("TERCER_LUGAR");
			partidoRepository.save(partidoTercerLugar);
		}

		return "Siguiente ronda generada con éxito.";
	}
 	
 // 1. Eliminar un participante ESPECÍFICO de un torneo
    @DeleteMapping("/{torneoId}/participante/{participanteId}")
    public String eliminarParticipante(@PathVariable Long torneoId, @PathVariable Long participanteId) {
        Torneo torneo = torneoRepository.findById(torneoId).orElse(null);
        if (torneo != null && torneo.getEstado().equals("INSCRIPCION")) {
            torneo.getParticipantes().removeIf(p -> p.getId().equals(participanteId));
            torneoRepository.save(torneo);
            return "Participante eliminado del torneo.";
        }
        return "No se puede eliminar: el torneo ya inició o no existe.";
    }

    // 2. Eliminar un TORNEO completo (y sus partidos)
    @DeleteMapping("/{id}")
    public String eliminarTorneo(@PathVariable Long id) {
        // Primero borramos todos los partidos de ese torneo para evitar errores de SQL
        List<Partido> partidos = partidoRepository.findAll().stream()
                .filter(p -> p.getTorneoId() != null && p.getTorneoId().equals(id))
                .collect(Collectors.toList());
        partidoRepository.deleteAll(partidos);
        
        // Luego borramos el torneo
        torneoRepository.deleteById(id);
        return "Torneo y sus partidos eliminados con éxito.";
    }
}