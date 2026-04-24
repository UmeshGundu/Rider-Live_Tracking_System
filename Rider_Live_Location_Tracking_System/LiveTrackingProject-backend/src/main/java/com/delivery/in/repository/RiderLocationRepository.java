package com.delivery.in.repository;

import com.delivery.in.entity.RiderLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiderLocationRepository extends JpaRepository<RiderLocation, Long> {

    /**
     * Fetch the single most-recent location for a rider. Used by the REST
     * endpoint so the User App can show a pin immediately on first open, before
     * any WebSocket update arrives.
     */
    @Query("SELECT r FROM RiderLocation r WHERE r.riderId = :riderId "
            + "ORDER BY r.recordedAt DESC")
    List<RiderLocation> findLatestByRiderId(@Param("riderId") String riderId);

    /**
     * Full route history ordered chronologically (for replay / analytics).
     */
    List<RiderLocation> findByRiderIdOrderByRecordedAtAsc(String riderId);

    /**
     * Quick existence check – used in health/debug endpoint.
     */
    boolean existsByRiderId(String riderId);
}
