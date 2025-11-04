package com.tpx.urlshortener.service;

import com.tpx.urlshortener.repository.UrlMappingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AliasGeneratorTest {

    @Mock
    private UrlMappingRepository repository;

    private AliasGenerator aliasGenerator;

    @BeforeEach
    void setUp() {
        aliasGenerator = new AliasGenerator(repository);
    }

    @Test
    void generateUniqueAlias_ShouldGenerateValidAlias() {
        // Given
        when(repository.existsByAlias(anyString())).thenReturn(false);

        // When
        String alias = aliasGenerator.generateUniqueAlias();

        // Then
        assertNotNull(alias);
        assertTrue(alias.length() >= 6 && alias.length() <= 8);
        assertTrue(alias.matches("^[A-Za-z0-9]+$"));
    }

    @Test
    void generateUniqueAlias_WithCollision_ShouldRetry() {
        // Given
        Set<String> generated = new HashSet<>();
        when(repository.existsByAlias(anyString())).thenAnswer(invocation -> {
            String alias = invocation.getArgument(0);
            return generated.contains(alias);
        });

        // When
        String alias1 = aliasGenerator.generateUniqueAlias();
        generated.add(alias1);
        String alias2 = aliasGenerator.generateUniqueAlias();
        generated.add(alias2);

        // Then
        assertNotNull(alias1);
        assertNotNull(alias2);
        assertNotEquals(alias1, alias2);
    }
}
