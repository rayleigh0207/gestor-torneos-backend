package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.example.demo.model.Participante;
import com.example.demo.repository.ParticipanteRepository;

import java.util.List;

@RestController
@RequestMapping("/api/participantes")
@CrossOrigin("*")
public class ParticipanteController {

	@Autowired
	private ParticipanteRepository participanteRepository;
	
	@PostMapping
	public Participante registrarParticipante(@RequestBody Participante participante) {
		return participanteRepository.save(participante);
	}
	
	@GetMapping
	public List<Participante> obtenerParticipantes(){
		return participanteRepository.findAll();
	}
}
