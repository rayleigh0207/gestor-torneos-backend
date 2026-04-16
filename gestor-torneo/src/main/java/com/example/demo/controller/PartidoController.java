package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.example.demo.model.Partido;
import com.example.demo.model.Participante;
import com.example.demo.repository.PartidoRepository;
import com.example.demo.repository.ParticipanteRepository;

import java.util.List;

@RestController
@RequestMapping("/api/partidos")
@CrossOrigin("*")
public class PartidoController {
	
	@Autowired
	private PartidoRepository partidoRepository;
	
	@Autowired
	private ParticipanteRepository participanteRepository;
	
	@GetMapping
	public List<Partido> obtenerPartidos(){
		return partidoRepository.findAll();
	}
	
	// Método original: Útil para dar victoria directa 
	@PostMapping("/{partidoId}/ganador/{ganadorId}")
	public Partido reportarGanador(@PathVariable Long partidoId, @PathVariable Long ganadorId) {
		Partido partido = partidoRepository.findById(partidoId).orElse(null);
		Participante ganador = participanteRepository.findById(ganadorId).orElse(null);
		
		if (partido != null && ganador != null) {
			partido.setGanador(ganador);
			return partidoRepository.save(partido);
		}
		return null;
	}

	
	@PostMapping("/{partidoId}/resultado")
	public Partido registrarResultado(
			@PathVariable Long partidoId, 
			@RequestParam Integer pts1, 
			@RequestParam Integer pts2) {
		
		Partido partido = partidoRepository.findById(partidoId).orElse(null);
		if (partido == null) return null;

		// 1. Guardamos los puntos exactos del partido
		partido.setPuntuacionJugador1(pts1);
		partido.setPuntuacionJugador2(pts2);

		// 2. Lógica de victoria: El número mayor gana
		if (pts1 > pts2) {
			partido.setGanador(partido.getJugador1());
		} else if (pts2 > pts1) {
			partido.setGanador(partido.getJugador2());
		} else {
			// Si hay empate, se queda sin ganador hasta que hagan el desempate
			partido.setGanador(null); 
		}

		return partidoRepository.save(partido);
	}
}