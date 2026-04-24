package com.delivery.in.service;

import com.delivery.in.dto.LocationUpdateDTO;
import com.delivery.in.entity.RiderLocation;
import com.delivery.in.repository.RiderLocationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * LocationService
 *
 * Every time the rider sends a GPS update this service does two things:
 *
 *  1. PERSIST  – saves the point to MySQL so history is available.
 *  2. BROADCAST – pushes the DTO as JSON to every User session subscribed
 *                 to /topic/rider/{riderId}.
 *
 * SimpMessagingTemplate is Spring's "radio tower":
 *   messagingTemplate.convertAndSend(destination, payload)
 *   → Jackson serialises the DTO to JSON
 *   → Spring wraps it in a STOMP MESSAGE frame
 *   → the in-memory broker writes the frame to every matching subscriber
 */
@Service
public class LocationService {

    private static final Logger log = LoggerFactory.getLogger(LocationService.class);

    @Autowired
    private RiderLocationRepository repo;

    /**
     * Injected by Spring from the WebSocket infrastructure.
     * convertAndSend(dest, obj) → JSON → STOMP frame → all subscribers.
     */
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // ─────────────────────────────────────────────────────────────────────────
    //  Main entry point – called by the controller for every rider update
    // ─────────────────────────────────────────────────────────────────────────

    public void processLocationUpdate(LocationUpdateDTO dto) {
        log.debug("Processing: {}", dto);

        // 1. Persist to MySQL
        RiderLocation entity = new RiderLocation(
            null, dto.getRiderId(),
            dto.getLatitude(),
            dto.getLongitude(),
            dto.getAccuracy(),
            LocalDateTime.now()
        );
        repo.save(entity);
        log.info("[DB] Saved location for rider {} → ({}, {})",
                 dto.getRiderId(), dto.getLatitude(), dto.getLongitude());

        // 2. Broadcast to all subscribers of this rider's topic
        //    Destination pattern: /topic/rider/{riderId}
        //    Every User App that called stompClient.subscribe("/topic/rider/RIDER_001", ...)
        //    will receive this message instantly.
        String destination = "/topic/rider/" + dto.getRiderId();
        messagingTemplate.convertAndSend(destination, dto);
        log.info("[WS] Broadcast to {} → lat={}, lng={}",
                 destination, dto.getLatitude(), dto.getLongitude());
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  REST helper – last known position (used on User App first load)
    // ─────────────────────────────────────────────────────────────────────────

    public LocationUpdateDTO getLastKnownLocation(String riderId) {
        List<RiderLocation> results = repo.findLatestByRiderId(riderId);
        if (results.isEmpty()) {
            log.warn("No location history for rider: {}", riderId);
            return null;
        }
        RiderLocation latest = results.get(0);
        return new LocationUpdateDTO(
            latest.getRiderId(),
            latest.getLatitude(),
            latest.getLongitude(),
            java.sql.Timestamp.valueOf(latest.getRecordedAt()).getTime(),
            latest.getAccuracy()
        );
    }
}
