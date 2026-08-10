package com.velora.police.repository;

import com.velora.police.entity.PoliceUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PoliceUnitRepository extends JpaRepository<PoliceUnit, Long> {
    Optional<PoliceUnit> findByUserId(Long userId);
}
