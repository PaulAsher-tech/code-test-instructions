package com.tpx.urlshortener.repository;

import com.tpx.urlshortener.model.UrlMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UrlMappingRepository extends JpaRepository<UrlMapping, Long> {
    Optional<UrlMapping> findByAlias(String alias);
    boolean existsByAlias(String alias);
    void deleteByAlias(String alias);
}


