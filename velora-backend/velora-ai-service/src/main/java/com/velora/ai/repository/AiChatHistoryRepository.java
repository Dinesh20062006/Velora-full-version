package com.velora.ai.repository;

import com.velora.ai.entity.AiChatHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiChatHistoryRepository extends JpaRepository<AiChatHistory, Long> {
    List<AiChatHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
}
