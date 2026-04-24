package com.delivery.in;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RiderTrackingApplication {

    public static void main(String[] args) {
        SpringApplication.run(RiderTrackingApplication.class, args);
        System.out.println("===========================================");
        System.out.println("  Rider Tracking WebSocket Server Started  ");
        System.out.println("  WebSocket endpoint: ws://localhost:8080/ws");
        System.out.println("  Send location to: /app/location");
        System.out.println("  Subscribe to: /topic/rider/{riderId}");
        System.out.println("===========================================");
    }
}
