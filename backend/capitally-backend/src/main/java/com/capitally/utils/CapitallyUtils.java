package com.capitally.utils;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;

import java.util.List;
import java.util.function.Supplier;

public class CapitallyUtils {

    public static <T> void addIfNotNull(List<Predicate> predicates, T value, Supplier<Predicate> supplier) {
        if (value != null) {
            predicates.add(supplier.get());
        }
    }

    public static Predicate buildLikePredicate(CriteriaBuilder cb, Expression<String> path, String value) {
        return cb.like(cb.lower(path), "%" + value.toLowerCase() + "%");
    }
}
