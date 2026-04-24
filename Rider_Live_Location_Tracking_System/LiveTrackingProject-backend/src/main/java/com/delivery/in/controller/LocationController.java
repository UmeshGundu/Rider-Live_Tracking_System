package com.delivery.in.controller;

import com.delivery.in.dto.LocationUpdateDTO;
import com.delivery.in.service.LocationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * LocationController
 *
 * Two responsibilities:
 *
 *  A) WebSocket handler
 *     @MessageMapping("/location") listens on STOMP destination /app/location.
 *     Spring deserialises the JSON body → LocationUpdateDTO automatically.
 *     The method delegates to LocationService which persists + broadcasts.
 *
 *  B) REST endpoints (nested @RestController)
 *     GET /api/location/{riderId}/last  → last known position (for first load)
 *     GET /api/health                   → sanity check
 */
 @RestController
public class LocationController {

    private static final Logger log = LoggerFactory.getLogger(LocationController.class);

    @Autowired
    private LocationService locationService;

    // ── A) WebSocket ─────────────────────────────────────────────────────────

    /**
     * Rider sends GPS update to STOMP destination /app/location.
     * Spring converts the JSON body to LocationUpdateDTO, calls this method.
     * Service persists to MySQL and broadcasts to /topic/rider/{riderId}.
     */
    @MessageMapping("/location")
    public void receiveLocation(@Payload LocationUpdateDTO locationUpdate) {
        log.info("[WS IN] Rider {} → ({}, {})",
                 locationUpdate.getRiderId(),
                 locationUpdate.getLatitude(),
                 locationUpdate.getLongitude());
        locationService.processLocationUpdate(locationUpdate);
    }

    // ── B) REST ──────────────────────────────────────────────────────────────

   
    @RequestMapping("/api")
    public class RestController {

        /**
         * User App calls this on first load to immediately place a marker
         * before any WebSocket update arrives.
         *
         * GET /api/location/RIDER_001/last
         */
        @GetMapping("/location/{riderId}/last")
        public ResponseEntity<?> getLastLocation(@PathVariable String riderId) {
            LocationUpdateDTO dto = locationService.getLastKnownLocation(riderId);
            if (dto == null) {
                return ResponseEntity.ok(
                    Map.of("message", "No location data yet for " + riderId)
                );
            }
            return ResponseEntity.ok(dto);
        }

        /**
         * Health check – confirms the server is up.
         * GET /api/health
         */
        @GetMapping("/health")
        public ResponseEntity<Map<String, String>> health() {
            return ResponseEntity.ok(Map.of(
                "status",  "UP",
                "message", "Rider Tracking WebSocket Server is running"
            ));
        }
    }
}
