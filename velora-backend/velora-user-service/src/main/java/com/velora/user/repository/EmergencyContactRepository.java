package com.velora.user.repository;

import com.velora.user.entity.EmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, Long> {
    List<EmergencyContact> findByUserIdOrderByPrimaryDescCreatedAtAsc(Long userId);
    Optional<EmergencyContact> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);
    boolean existsByIdAndUserId(Long id, Long userId);
}
