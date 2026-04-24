package com.delivery.in.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * RiderLocation - JPA Entity mapped to the rider_location table in MySQL.
 *
 * Every location update is persisted here so we can: - Replay the route after
 * delivery - Audit trail for disputes - Analytics on rider paths
 */
@Entity
@Table(
        name = "rider_location",
        indexes = {
            @Index(name = "idx_rider_id", columnList = "rider_id"),
            @Index(name = "idx_timestamp", columnList = "recorded_at")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiderLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rider_id", nullable = false, length = 50)
    private String riderId;

    @Column(name = "latitude", nullable = false)
    private double latitude;

    @Column(name = "longitude", nullable = false)
    private double longitude;

    /**
     * GPS accuracy in metres – 0 if not provided
     */
    @Column(name = "accuracy")
    private double accuracy;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

}
