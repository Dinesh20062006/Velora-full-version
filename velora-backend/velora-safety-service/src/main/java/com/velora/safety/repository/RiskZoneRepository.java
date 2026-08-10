package com.velora.safety.repository;

import com.velora.safety.entity.RiskZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RiskZoneRepository extends JpaRepository<RiskZone, Long> {
}
