package com.delivery.in.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocketConfig
 *
 * Registers the STOMP-over-SockJS endpoint and sets up the in-memory
 * message broker used to fan location updates out to every subscribed user.
 *
 * Clients connect to:  ws://HOST:8080/ws   (or http:// for SockJS polling)
 * Rider publishes to:  /app/location
 * Users subscribe to:  /topic/rider/{riderId}
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
            .addEndpoint("/ws")
            // Accept connections from Expo Go, dev builds, and production apps
            .setAllowedOriginPatterns("*")
            // SockJS gives a transparent HTTP fallback for networks that block
            // raw WebSocket upgrades (hotel Wi-Fi, some corporate proxies, etc.)
            .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Messages whose destination starts with /app are routed to
        // @MessageMapping methods in @Controller classes.
        registry.setApplicationDestinationPrefixes("/app");

        // The in-memory broker handles /topic (broadcast) and /queue (p2p).
        // All sessions subscribed to /topic/rider/RIDER_001 receive every
        // message published there – no extra code needed.
        registry.enableSimpleBroker("/topic", "/queue");
    }
}
