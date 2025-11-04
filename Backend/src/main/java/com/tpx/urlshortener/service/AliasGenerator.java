package com.tpx.urlshortener.service;

import com.tpx.urlshortener.repository.UrlMappingRepository;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class AliasGenerator {

    private static final char[] BASE62 =
            "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".toCharArray();
    private static final int DEFAULT_MIN_LENGTH = 6;
    private static final int DEFAULT_MAX_LENGTH = 8;
    private static final int MAX_RETRIES = 20;

    private final SecureRandom random = new SecureRandom();
    private final UrlMappingRepository repository;

    public AliasGenerator(UrlMappingRepository repository) {
        this.repository = repository;
    }

    public String generateUniqueAlias() {
        for (int attempt = 0; attempt < MAX_RETRIES; attempt++) {
            int length = DEFAULT_MIN_LENGTH + random.nextInt(DEFAULT_MAX_LENGTH - DEFAULT_MIN_LENGTH + 1);
            String candidate = randomBase62(length);
            if (!repository.existsByAlias(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Unable to generate a unique alias after retries");
    }

    private String randomBase62(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(BASE62[random.nextInt(BASE62.length)]);
        }
        return sb.toString();
    }
}


