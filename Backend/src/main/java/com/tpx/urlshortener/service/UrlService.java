package com.tpx.urlshortener.service;

import com.tpx.urlshortener.exception.AliasAlreadyExistsException;
import com.tpx.urlshortener.exception.InvalidInputException;
import com.tpx.urlshortener.exception.NotFoundException;
import com.tpx.urlshortener.model.UrlMapping;
import com.tpx.urlshortener.repository.UrlMappingRepository;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;

@Service
public class UrlService {

    private static final String ALIAS_REGEX = "^[A-Za-z0-9_-]{3,128}$";

    private final UrlMappingRepository repository;
    private final AliasGenerator aliasGenerator;

    public UrlService(UrlMappingRepository repository, AliasGenerator aliasGenerator) {
        this.repository = repository;
        this.aliasGenerator = aliasGenerator;
    }

    public UrlMapping shorten(String fullUrl, String customAlias) {
        if (!isValidHttpUrl(fullUrl)) {
            throw new InvalidInputException("fullUrl must be a valid http/https URL");
        }

        String alias;
        if (customAlias != null && !customAlias.isBlank()) {
            validateAlias(customAlias);
            if (repository.existsByAlias(customAlias)) {
                throw new AliasAlreadyExistsException(customAlias);
            }
            alias = customAlias;
        } else {
            alias = aliasGenerator.generateUniqueAlias();
        }

        UrlMapping mapping = new UrlMapping(alias, normalizeUrl(fullUrl));
        return repository.save(mapping);
    }

    public UrlMapping resolve(String alias) {
        validateAliasLookup(alias);
        return repository.findByAlias(alias)
                .orElseThrow(() -> new NotFoundException("Alias not found: " + alias));
    }

    public void delete(String alias) {
        validateAliasLookup(alias);
        boolean exists = repository.existsByAlias(alias);
        if (!exists) {
            throw new NotFoundException("Alias not found: " + alias);
        }
        repository.deleteByAlias(alias);
    }

    public List<UrlMapping> listAll() {
        return repository.findAll();
    }

    private void validateAlias(String alias) {
        if (!alias.matches(ALIAS_REGEX)) {
            throw new InvalidInputException("customAlias must match pattern " + ALIAS_REGEX);
        }
    }

    private void validateAliasLookup(String alias) {
        if (alias == null || alias.isBlank()) {
            throw new InvalidInputException("alias is required");
        }
        // Allow broader lookups; we only restrict creation format strictly
        if (alias.length() > 128) {
            throw new InvalidInputException("alias too long");
        }
    }

    private boolean isValidHttpUrl(String url) {
        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme();
            return scheme != null && (Objects.equals("http", scheme) || Objects.equals("https", scheme))
                    && uri.getHost() != null;
        } catch (URISyntaxException e) {
            return false;
        }
    }

    private String normalizeUrl(String url) {
        // Basic normalization: trim spaces
        return url.trim();
    }
}


