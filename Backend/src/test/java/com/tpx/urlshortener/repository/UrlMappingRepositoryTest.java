package com.tpx.urlshortener.repository;

import com.tpx.urlshortener.model.UrlMapping;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class UrlMappingRepositoryTest {

    @Autowired
    private UrlMappingRepository repository;

    @Test
    void save_WithValidMapping_ShouldPersist() {
        // Given
        UrlMapping mapping = new UrlMapping("test-alias", "https://example.com");

        // When
        UrlMapping saved = repository.save(mapping);

        // Then
        assertNotNull(saved.getId());
        assertEquals("test-alias", saved.getAlias());
        assertEquals("https://example.com", saved.getFullUrl());
    }

    @Test
    void findByAlias_WithExistingAlias_ShouldReturnMapping() {
        // Given
        UrlMapping mapping = new UrlMapping("test-alias", "https://example.com");
        repository.save(mapping);

        // When
        Optional<UrlMapping> found = repository.findByAlias("test-alias");

        // Then
        assertTrue(found.isPresent());
        assertEquals("test-alias", found.get().getAlias());
    }

    @Test
    void findByAlias_WithNonExistentAlias_ShouldReturnEmpty() {
        // When
        Optional<UrlMapping> found = repository.findByAlias("non-existent");

        // Then
        assertFalse(found.isPresent());
    }

    @Test
    void existsByAlias_WithExistingAlias_ShouldReturnTrue() {
        // Given
        UrlMapping mapping = new UrlMapping("test-alias", "https://example.com");
        repository.save(mapping);

        // When
        boolean exists = repository.existsByAlias("test-alias");

        // Then
        assertTrue(exists);
    }

    @Test
    void existsByAlias_WithNonExistentAlias_ShouldReturnFalse() {
        // When
        boolean exists = repository.existsByAlias("non-existent");

        // Then
        assertFalse(exists);
    }

    @Test
    void save_WithDuplicateAlias_ShouldThrowException() {
        // Given
        UrlMapping mapping1 = new UrlMapping("test-alias", "https://example.com/1");
        repository.save(mapping1);

        UrlMapping mapping2 = new UrlMapping("test-alias", "https://example.com/2");

        // When & Then
        assertThrows(DataIntegrityViolationException.class, () -> repository.save(mapping2));
    }

    @Test
    void deleteByAlias_WithExistingAlias_ShouldDelete() {
        // Given
        UrlMapping mapping = new UrlMapping("test-alias", "https://example.com");
        repository.save(mapping);

        // When
        repository.deleteByAlias("test-alias");

        // Then
        assertFalse(repository.existsByAlias("test-alias"));
    }
}
