package com.delivery.in.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LocationUpdateDTO - The data that travels over WebSocket.
 *
 * When a rider sends their GPS position, it arrives as JSON: { "riderId":
 * "RIDER_001", "latitude": 17.4126, "longitude": 78.2676, "timestamp":
 * 1702300000000 }
 *
 * Spring automatically deserializes this JSON into this object.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class LocationUpdateDTO {

    @JsonProperty("riderId")
    private String riderId;

    @JsonProperty("latitude")
    private double latitude;

    @JsonProperty("longitude")
    private double longitude;

    @JsonProperty("timestamp")
    private long timestamp;

    @JsonProperty("accuracy")
    private double accuracy;

}
