package com.example.demo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "torneos")
public class Torneo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String juego;
    
    // Estados: "INSCRIPCION", "EN_CURSO", "FINALIZADO"
    private String estado; 
    
    @ManyToMany
    @JoinTable(
        name = "torneo_participante", 
        joinColumns = @JoinColumn(name = "torneo_id"),
        inverseJoinColumns = @JoinColumn(name = "participante_id")
     )
    private List<Participante> participantes;

    
    // SOBRECARGA (OVERLOADING) 
    

    // Método 1: Actualiza el estado de forma normal
    public void actualizarEstado(String nuevoEstado) {
        this.estado = nuevoEstado;
    }

    // Método 2: SOBRECARGADO 
    // Permite registrar un motivo o nota de auditoría al cambiar el estado.
    public void actualizarEstado(String nuevoEstado, String motivoAdmin) {
        this.estado = nuevoEstado;
        System.out.println("Admin ITLA - Estado cambiado a [" + nuevoEstado + "] Motivo: " + motivoAdmin);
    }
}