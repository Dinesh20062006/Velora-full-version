package com.velora.auth.repository;

import com.velora.auth.entity.Otp;
import com.velora.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {
    Optional<Otp> findTopByUserAndPurposeAndIsUsedFalseOrderByIdDesc(User user, String purpose);
}
