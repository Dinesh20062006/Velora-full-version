package com.velora.ai.repository;

import com.velora.ai.entity.RiskPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RiskPredictionRepository extends JpaRepository<RiskPrediction, Long> {
}
