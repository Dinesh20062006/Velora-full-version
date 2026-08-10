package com.velora.gateway.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Component
@Order(-2)
public class GlobalErrorExceptionHandler implements ErrorWebExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalErrorExceptionHandler.class);

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();

        if (response.isCommitted()) {
            return Mono.error(ex);
        }

        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        HttpStatus status = HttpStatus.SERVICE_UNAVAILABLE;
        String message = "Service is temporarily unavailable. Please make sure the backend service is running.";

        if (ex instanceof ResponseStatusException responseStatusEx) {
            status = HttpStatus.valueOf(responseStatusEx.getStatusCode().value());
            if (status == HttpStatus.NOT_FOUND) {
                message = "The requested endpoint was not found on API Gateway.";
            } else if (responseStatusEx.getReason() != null) {
                message = responseStatusEx.getReason();
            }
        } else {
            log.error("Unhandled gateway exception for URI {}: {}", exchange.getRequest().getURI(), ex.getMessage());
        }

        response.setStatusCode(status);

        String jsonResponseBody = String.format(
                "{\"success\":false,\"message\":\"%s\",\"timestamp\":\"%s\",\"status\":%d}",
                message, LocalDateTime.now().toString(), status.value()
        );

        DataBuffer buffer = response.bufferFactory().wrap(jsonResponseBody.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }
}
