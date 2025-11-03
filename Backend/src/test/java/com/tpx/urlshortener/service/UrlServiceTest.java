package com.tpx.urlshortener.service;

import com.tpx.urlshortener.exception.AliasAlreadyExistsException;
import com.tpx.urlshortener.exception.InvalidInputException;
import com.tpx.urlshortener.exception.NotFoundException;
import com.tpx.urlshortener.model.UrlMapping;
import com.tpx.urlshortener.repository.UrlMappingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UrlServiceTest {

    @Mock
    private UrlMappingRepository repository;

    @Mock
    private AliasGenerator aliasGenerator;

    @InjectMocks
    private UrlService urlService;

    private static final String VALID_URL = "https://example.com/very/long/url";
    private static final String VALID_ALIAS = "my-custom-alias";

    @BeforeEach
    void setUp() {
        // Setup common mocks
    }

    @Test
    void shorten_WithValidUrl_ShouldGenerateAlias() {
        // Given
        when(repository.existsByAlias(anyString())).thenReturn(false);
        when(aliasGenerator.generateUniqueAlias()).thenReturn("abc123");
        when(repository.save(any(UrlMapping.class))).thenAnswer(invocation -> {
            UrlMapping mapping = invocation.getArgument(0);
            mapping.setId(1L);
            return mapping;
        });

        // When
        UrlMapping result = urlService.shorten(VALID_URL, null);

        // Then
        assertNotNull(result);
        assertEquals("abc123", result.getAlias());
        assertEquals(VALID_URL.trim(), result.getFullUrl());
        verify(repository).save(any(UrlMapping.class));
        verify(aliasGenerator).generateUniqueAlias();
    }

    @Test
    void shorten_WithCustomAlias_ShouldUseCustomAlias() {
        // Given
        when(repository.existsByAlias(VALID_ALIAS)).thenReturn(false);
        when(repository.save(any(UrlMapping.class))).thenAnswer(invocation -> {
            UrlMapping mapping = invocation.getArgument(0);
            mapping.setId(1L);
            return mapping;
        });

        // When
        UrlMapping result = urlService.shorten(VALID_URL, VALID_ALIAS);

        // Then
        assertNotNull(result);
        assertEquals(VALID_ALIAS, result.getAlias());
        assertEquals(VALID_URL.trim(), result.getFullUrl());
        verify(repository).save(any(UrlMapping.class));
        verify(aliasGenerator, never()).generateUniqueAlias();
    }

    @Test
    void shorten_WithInvalidUrl_ShouldThrowInvalidInputException() {
        // When & Then
        assertThrows(InvalidInputException.class, () -> urlService.shorten("not-a-url", null));
        assertThrows(InvalidInputException.class, () -> urlService.shorten("ftp://example.com", null));
        assertThrows(InvalidInputException.class, () -> urlService.shorten("", null));
    }

    @Test
    void shorten_WithDuplicateAlias_ShouldThrowAliasAlreadyExistsException() {
        // Given
        when(repository.existsByAlias(VALID_ALIAS)).thenReturn(true);

        // When & Then
        assertThrows(AliasAlreadyExistsException.class, () -> urlService.shorten(VALID_URL, VALID_ALIAS));
        verify(repository, never()).save(any());
    }

    @Test
    void shorten_WithInvalidAliasPattern_ShouldThrowInvalidInputException() {
        // Given
        when(repository.existsByAlias(anyString())).thenReturn(false);

        // When & Then
        assertThrows(InvalidInputException.class, () -> urlService.shorten(VALID_URL, "ab")); // too short
        assertThrows(InvalidInputException.class, () -> urlService.shorten(VALID_URL, "a@b")); // invalid char
    }

    @Test
    void resolve_WithValidAlias_ShouldReturnMapping() {
        // Given
        UrlMapping mapping = new UrlMapping(VALID_ALIAS, VALID_URL);
        mapping.setId(1L);
        when(repository.findByAlias(VALID_ALIAS)).thenReturn(Optional.of(mapping));

        // When
        UrlMapping result = urlService.resolve(VALID_ALIAS);

        // Then
        assertNotNull(result);
        assertEquals(VALID_ALIAS, result.getAlias());
        assertEquals(VALID_URL, result.getFullUrl());
    }

    @Test
    void resolve_WithNonExistentAlias_ShouldThrowNotFoundException() {
        // Given
        when(repository.findByAlias(VALID_ALIAS)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(NotFoundException.class, () -> urlService.resolve(VALID_ALIAS));
    }

    @Test
    void delete_WithValidAlias_ShouldDelete() {
        // Given
        when(repository.existsByAlias(VALID_ALIAS)).thenReturn(true);

        // When
        urlService.delete(VALID_ALIAS);

        // Then
        verify(repository).deleteByAlias(VALID_ALIAS);
    }

    @Test
    void delete_WithNonExistentAlias_ShouldThrowNotFoundException() {
        // Given
        when(repository.existsByAlias(VALID_ALIAS)).thenReturn(false);

        // When & Then
        assertThrows(NotFoundException.class, () -> urlService.delete(VALID_ALIAS));
        verify(repository, never()).deleteByAlias(anyString());
    }

    @Test
    void listAll_ShouldReturnAllMappings() {
        // Given
        UrlMapping mapping1 = new UrlMapping("alias1", "https://example.com/1");
        mapping1.setId(1L);
        UrlMapping mapping2 = new UrlMapping("alias2", "https://example.com/2");
        mapping2.setId(2L);
        when(repository.findAll()).thenReturn(Arrays.asList(mapping1, mapping2));

        // When
        List<UrlMapping> result = urlService.listAll();

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(repository).findAll();
    }
}
