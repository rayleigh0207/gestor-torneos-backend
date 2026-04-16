package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.demo.model.Partido;
import java.util.List;

@Repository
public interface PartidoRepository extends JpaRepository<Partido, Long> {
	List<Partido> findByTorneoId(Long torneoId);
}
