package com.capitally.app.service;

import com.capitally.app.config.ResendProperties;
import com.capitally.app.core.entity.PasswordResetEmailLogEntity;
import com.capitally.app.core.entity.UserEntity;
import com.capitally.app.core.repository.PasswordResetEmailLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static com.capitally.app.utils.CapitallyErrors.AUTH_FORGOT_PASSWORD_DAILY_LIMIT_ERROR;
import static com.capitally.app.utils.CapitallyErrors.AUTH_FORGOT_PASSWORD_MONTHLY_LIMIT_ERROR;

@Service
@RequiredArgsConstructor
public class ForgotPasswordEmailQuotaService {
    private static final String QUOTA_LOCK_KEY = "forgot-password-email-quota";

    private final PasswordResetEmailLogRepository repository;
    private final ResendProperties properties;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void reserve(UserEntity user) {
        repository.lockQuota(QUOTA_LOCK_KEY);

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfNextDay = startOfDay.plusDays(1);
        LocalDateTime startOfMonth = now.toLocalDate().withDayOfMonth(1).atStartOfDay();
        LocalDateTime startOfNextMonth = startOfMonth.plusMonths(1);

        long dailyCount = repository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(startOfDay, startOfNextDay);
        if (isLimitReached(properties.getForgotPasswordDailyLimit(), dailyCount)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, AUTH_FORGOT_PASSWORD_DAILY_LIMIT_ERROR);
        }

        long monthlyCount = repository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(startOfMonth, startOfNextMonth);
        if (isLimitReached(properties.getForgotPasswordMonthlyLimit(), monthlyCount)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, AUTH_FORGOT_PASSWORD_MONTHLY_LIMIT_ERROR);
        }

        repository.save(PasswordResetEmailLogEntity.builder()
                .user(user)
                .recipientEmail(user.getEmail())
                .createdAt(now)
                .build());
    }

    private boolean isLimitReached(int limit, long currentCount) {
        return limit <= 0 || currentCount >= limit;
    }
}
