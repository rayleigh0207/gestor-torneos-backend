package com.example.demo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@Entity
@Table(name = "partidos")

public class Partido {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@ManyToOne
	@JoinColumn(name = "torneo_id")
	private Torneo torneo;
	
	private Integer ronda;
	
	@ManyToOne
	@JoinColumn(name = "jugador1_id")
	private Participante jugador1;
	
	@ManyToOne
	@JoinColumn(name = "jugador2_id")
	private Participante jugador2;
	
	@Column(name = "id_del_torneo")
	private Long torneoId;
	
	public Long getTorneoId() { return torneoId; }
	public void setTorneoId(Long torneoId) {this.torneoId = torneoId; }
	
	private Integer puntuacionJugador1;
	private Integer puntuacionJugador2;
	
	private String fase;
	
	@ManyToOne
	@JoinColumn(name = "ganador_id")
	private Participante ganador;
	
	@ManyToOne
	@JoinColumn(name = "siguiente_partido_id")
	private Partido siguientePartido;
	
	public Partido() {
		
	}
}
