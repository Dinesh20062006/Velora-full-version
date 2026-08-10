package com.velora.safety.repository;

import com.velora.safety.entity.SafeZone;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SafeZoneRepository extends JpaRepository<SafeZone, Long> {

    Page<SafeZone> findByActiveTrueOrderBySafetyScoreDesc(Pageable pageable);

    Page<SafeZone> findByZoneTypeAndActiveTrueOrderBySafetyScoreDesc(SafeZone.ZoneType zoneType, Pageable pageable);

    @Query("SELECT sz FROM SafeZone sz WHERE sz.active = true AND " +
           "(6371000 * acos(cos(radians(:lat)) * cos(radians(sz.latitude)) * " +
           "cos(radians(sz.longitude) - radians(:lon)) + " +
           "sin(radians(:lat)) * sin(radians(sz.latitude)))) < :radiusMeters " +
           "ORDER BY (6371000 * acos(cos(radians(:lat)) * cos(radians(sz.latitude)) * " +
           "cos(radians(sz.longitude) - radians(:lon)) + " +
           "sin(radians(:lat)) * sin(radians(sz.latitude)))) ASC")
    List<SafeZone> findNearbySafeZones(
            @Param("lat") double latitude,
            @Param("lon") double longitude,
            @Param("radiusMeters") double radiusMeters);
}
