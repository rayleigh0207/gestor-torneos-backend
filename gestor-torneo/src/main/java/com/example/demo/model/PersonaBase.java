package com.example.demo.model;

import jakarta.persistence.MappedSuperclass;


@MappedSuperclass
public abstract class PersonaBase {
 
 private String nombre;
 private String correo;

 // Genera aquí los Getters y Setters de nombre y correo
 public String getNombre() { return nombre; }
 public void setNombre(String nombre) { this.nombre = nombre; }
 public String getCorreo() { return correo; }
 public void setCorreo(String correo) { this.correo = correo; }
}