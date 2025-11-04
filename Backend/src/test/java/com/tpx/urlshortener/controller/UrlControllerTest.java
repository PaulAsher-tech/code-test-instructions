package com.tpx.urlshortener.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tpx.urlshortener.dto.ShortenRequest;
import com.tpx.urlshortener.dto.ShortenResponse;
import com.tpx.urlshortener.dto.UrlItem;
import com.tpx.urlshortener.exception.AliasAlreadyExistsException;
import com.tpx.urlshortener.exception.InvalidInputException;
import com.tpx.urlshortener.exception.NotFoundException;
import com.tpx.urlshortener.model.UrlMapping;
import com.tpx.urlshortener.service.UrlService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UrlController.class)
class UrlControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UrlService urlService;

    private static final String VALID_URL = "https://example.com/very/long/url";
    private static final String VALID_ALIAS = "my-custom-alias";

    @Test
    void shorten_WithValidRequest_ShouldReturn201() throws Exception {
        // Given
        ShortenRequest request = new ShortenRequest();
        request.setFullUrl(VALID_URL);
        request.setCustomAlias(VALID_ALIAS);

        UrlMapping mapping = new UrlMapping(VALID_ALIAS, VALID_URL);
        mapping.setId(1L);
        when(urlService.shorten(VALID_URL, VALID_ALIAS)).thenReturn(mapping);

        // When & Then
        mockMvc.perform(post("/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shortUrl", containsString(VALID_ALIAS)));
    }

    @Test
    void shorten_WithoutCustomAlias_ShouldReturn201() throws Exception {
        // Given
        ShortenRequest request = new ShortenRequest();
        request.setFullUrl(VALID_URL);

        UrlMapping mapping = new UrlMapping("abc123", VALID_URL);
        mapping.setId(1L);
        when(urlService.shorten(VALID_URL, null)).thenReturn(mapping);

        // When & Then
        mockMvc.perform(post("/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shortUrl").exists());
    }

    @Test
    void shorten_WithInvalidInput_ShouldReturn400() throws Exception {
        // Given
        ShortenRequest request = new ShortenRequest();
        request.setFullUrl("not-a-url");

        when(urlService.shorten(anyString(), any())).thenThrow(new InvalidInputException("fullUrl must be a valid http/https URL"));

        // When & Then
        mockMvc.perform(post("/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void shorten_WithDuplicateAlias_ShouldReturn400() throws Exception {
        // Given
        ShortenRequest request = new ShortenRequest();
        request.setFullUrl(VALID_URL);
        request.setCustomAlias(VALID_ALIAS);

        when(urlService.shorten(VALID_URL, VALID_ALIAS)).thenThrow(new AliasAlreadyExistsException(VALID_ALIAS));

        // When & Then
        mockMvc.perform(post("/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Alias already exists")));
    }

    @Test
    void redirect_WithValidAlias_ShouldReturn302() throws Exception {
        // Given
        UrlMapping mapping = new UrlMapping(VALID_ALIAS, VALID_URL);
        mapping.setId(1L);
        when(urlService.resolve(VALID_ALIAS)).thenReturn(mapping);

        // When & Then
        mockMvc.perform(get("/" + VALID_ALIAS))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", VALID_URL));
    }

    @Test
    void redirect_WithNonExistentAlias_ShouldReturn404() throws Exception {
        // Given
        when(urlService.resolve(VALID_ALIAS)).thenThrow(new NotFoundException("Alias not found: " + VALID_ALIAS));

        // When & Then
        mockMvc.perform(get("/" + VALID_ALIAS))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("not found")));
    }

    @Test
    void delete_WithValidAlias_ShouldReturn204() throws Exception {
        // Given
        doNothing().when(urlService).delete(VALID_ALIAS);

        // When & Then
        mockMvc.perform(delete("/" + VALID_ALIAS))
                .andExpect(status().isNoContent());
        verify(urlService).delete(VALID_ALIAS);
    }

    @Test
    void delete_WithNonExistentAlias_ShouldReturn404() throws Exception {
        // Given
        doThrow(new NotFoundException("Alias not found: " + VALID_ALIAS)).when(urlService).delete(VALID_ALIAS);

        // When & Then
        mockMvc.perform(delete("/" + VALID_ALIAS))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void list_ShouldReturn200WithAllUrls() throws Exception {
        // Given
        UrlMapping mapping1 = new UrlMapping("alias1", "https://example.com/1");
        mapping1.setId(1L);
        UrlMapping mapping2 = new UrlMapping("alias2", "https://example.com/2");
        mapping2.setId(2L);
        List<UrlMapping> mappings = Arrays.asList(mapping1, mapping2);
        when(urlService.listAll()).thenReturn(mappings);

        // When & Then
        mockMvc.perform(get("/urls"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].alias", is("alias1")))
                .andExpect(jsonPath("$[0].fullUrl", is("https://example.com/1")))
                .andExpect(jsonPath("$[0].shortUrl").exists())
                .andExpect(jsonPath("$[1].alias", is("alias2")))
                .andExpect(jsonPath("$[1].fullUrl", is("https://example.com/2")))
                .andExpect(jsonPath("$[1].shortUrl").exists());
    }
}
