package com.velora.safety.repository;

import com.velora.safety.entity.Incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {

    Page<Incident> findByReporterUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Incident> findByStatusOrderByCreatedAtDesc(Incident.IncidentStatus status, Pageable pageable);

    Page<Incident> findByIncidentTypeOrderByCreatedAtDesc(Incident.IncidentType type, Pageable pageable);

    Optional<Incident> findByIdAndReporterUserId(Long id, Long userId);

    @Query("SELECT i FROM Incident i WHERE " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:type IS NULL OR i.incidentType = :type) AND " +
           "(:severity IS NULL OR i.severity = :severity) AND " +
           "(:city IS NULL OR LOWER(i.city) LIKE LOWER(CONCAT('%', :city, '%'))) AND " +
           "(:from IS NULL OR i.incidentDate >= :from) AND " +
           "(:to IS NULL OR i.incidentDate <= :to)")
    Page<Incident> searchIncidents(
            @Param("status") Incident.IncidentStatus status,
            @Param("type") Incident.IncidentType type,
            @Param("severity") Incident.IncidentSeverity severity,
            @Param("city") String city,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    @Query("SELECT i FROM Incident i WHERE " +
           "(6371000 * acos(cos(radians(:lat)) * cos(radians(i.latitude)) * " +
           "cos(radians(i.longitude) - radians(:lon)) + " +
           "sin(radians(:lat)) * sin(radians(i.latitude)))) < :radiusMeters " +
           "ORDER BY i.createdAt DESC")
    List<Incident> findIncidentsNearLocation(
            @Param("lat") double latitude,
            @Param("lon") double longitude,
            @Param("radiusMeters") double radiusMeters);

    long countByStatus(Incident.IncidentStatus status);

    long countByIncidentType(Incident.IncidentType type);
}
