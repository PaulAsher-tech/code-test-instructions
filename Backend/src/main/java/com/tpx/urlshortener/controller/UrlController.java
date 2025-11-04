package com.tpx.urlshortener.controller;

import com.tpx.urlshortener.dto.ShortenRequest;
import com.tpx.urlshortener.dto.ShortenResponse;
import com.tpx.urlshortener.dto.UrlItem;
import com.tpx.urlshortener.model.UrlMapping;
import com.tpx.urlshortener.service.UrlService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
public class UrlController {

    private final UrlService urlService;

    public UrlController(UrlService urlService) {
        this.urlService = urlService;
    }

    @PostMapping("/shorten")
    public ResponseEntity<ShortenResponse> shorten(@RequestBody ShortenRequest request, HttpServletRequest httpRequest) {
        UrlMapping mapping = urlService.shorten(request.getFullUrl(), request.getCustomAlias());
        String shortUrl = buildShortUrl(httpRequest, mapping.getAlias());
        return ResponseEntity.status(HttpStatus.CREATED).body(new ShortenResponse(shortUrl));
    }

    @GetMapping("/{alias}")
    public ResponseEntity<Void> redirect(@PathVariable String alias) {
        UrlMapping mapping = urlService.resolve(alias);
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(mapping.getFullUrl()));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    @DeleteMapping("/{alias}")
    public ResponseEntity<Void> delete(@PathVariable String alias) {
        urlService.delete(alias);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/urls")
    public ResponseEntity<List<UrlItem>> list(HttpServletRequest httpRequest) {
        List<UrlItem> items = urlService.listAll().stream()
                .map(m -> new UrlItem(m.getAlias(), m.getFullUrl(), buildShortUrl(httpRequest, m.getAlias())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(items);
    }

    private String buildShortUrl(HttpServletRequest request, String alias) {
        String scheme = request.getScheme();
        String host = request.getServerName();
        int port = request.getServerPort();
        boolean standardPort = ("http".equals(scheme) && port == 80) || ("https".equals(scheme) && port == 443);
        String portPart = standardPort ? "" : ":" + port;
        return scheme + "://" + host + portPart + "/" + alias;
    }
}


