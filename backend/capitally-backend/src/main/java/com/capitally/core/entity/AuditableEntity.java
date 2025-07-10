package com.capitally.core.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@MappedSuperclass
public abstract class AuditableEntity {

    @Column(name = "created_at", insertable = false, updatable = false)
    protected LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    protected LocalDateTime updatedAt;

}