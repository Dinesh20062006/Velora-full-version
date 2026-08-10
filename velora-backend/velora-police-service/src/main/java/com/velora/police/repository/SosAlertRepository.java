package com.velora.police.repository;

import com.velora.police.entity.SosAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SosAlertRepository extends JpaRepository<SosAlert, Long> {
    List<SosAlert> findByStatusOrderByCreatedAtDesc(String status);
    List<SosAlert> findByUserIdOrderByCreatedAtDesc(Long userId);
}
