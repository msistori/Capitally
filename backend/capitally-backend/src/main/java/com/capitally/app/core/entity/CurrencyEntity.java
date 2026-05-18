package com.capitally.app.core.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "t_currency")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurrencyEntity {
    @Id
    private String code;
    private String name;
}