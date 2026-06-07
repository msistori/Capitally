package com.capitally.app.core.repository.spec;

import com.capitally.app.core.entity.TransactionEntity;
import com.capitally.app.model.request.TransactionExportFilter;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigInteger;

public class TransactionExportSpecifications {

    private TransactionExportSpecifications() {}

    public static Specification<TransactionEntity> build(BigInteger userId, TransactionExportFilter f) {
        return (root, query, cb) -> {

            if (!Long.class.equals(query.getResultType()) && !long.class.equals(query.getResultType())) {
                root.fetch("account", JoinType.LEFT);
                root.fetch("currency", JoinType.LEFT);
                root.fetch("category", JoinType.LEFT);
                query.distinct(true);
            }

            var p = cb.conjunction();
            p = cb.and(p, cb.equal(root.get("user").get("id"), userId));
            p = cb.and(p, cb.isNull(root.get("transferGroupId")));

            if (f == null) return p;

            if (f.getStartDate() != null) {
                p = cb.and(p, cb.greaterThanOrEqualTo(root.get("date"), f.getStartDate()));
            }
            if (f.getEndDate() != null) {
                p = cb.and(p, cb.lessThanOrEqualTo(root.get("date"), f.getEndDate()));
            }

            if (f.getMinAmount() != null) {
                p = cb.and(p, cb.greaterThanOrEqualTo(root.get("amount"), f.getMinAmount()));
            }
            if (f.getMaxAmount() != null) {
                p = cb.and(p, cb.lessThanOrEqualTo(root.get("amount"), f.getMaxAmount()));
            }

            if (f.getTransactionType() != null) {
                p = cb.and(p, cb.equal(root.get("transactionType"), f.getTransactionType()));
            }

            if (f.getAccount() != null && !f.getAccount().isBlank()) {
                p = cb.and(p, cb.equal(cb.lower(root.get("account").get("name")), f.getAccount().trim().toLowerCase()));
            }

            if (f.getMacroCategory() != null && !f.getMacroCategory().isBlank()) {
                p = cb.and(p, cb.equal(cb.lower(root.get("category").get("macroCategory")), f.getMacroCategory().trim().toLowerCase()));
            }

            if (f.getCategory() != null && !f.getCategory().isBlank()) {
                p = cb.and(p, cb.equal(cb.lower(root.get("category").get("category")), f.getCategory().trim().toLowerCase()));
            }

            if (f.getCurrency() != null && !f.getCurrency().isBlank()) {
                p = cb.and(p, cb.equal(cb.upper(root.get("currency").get("code")), f.getCurrency().trim().toUpperCase()));
            }

            if (f.getDescription() != null && !f.getDescription().isBlank()) {
                String like = "%" + escapeLike(f.getDescription().trim().toLowerCase()) + "%";
                p = cb.and(p, cb.like(cb.lower(root.get("description")), like, '\\'));
            }

            return p;
        };
    }

    private static String escapeLike(String input) {
        return input
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
