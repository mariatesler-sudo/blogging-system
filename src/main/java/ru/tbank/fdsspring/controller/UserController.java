package ru.tbank.fdsspring.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/currencies")
public class UserController {

    @GetMapping
    public ResponseEntity<?> getCurrencies() {
        return ResponseEntity.ok("OK");
    }

    @PostMapping
    public ResponseEntity<?> postCurrencies() {
        return ResponseEntity.ok("OK");
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCurrenciesById() {
        return ResponseEntity.ok("OK");
    }

    @PostMapping("/{id}")
    public ResponseEntity<?> postCurrenciesById() {
        return ResponseEntity.ok("OK");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCurrenciesById() {
        return ResponseEntity.ok("OK");
    }
}
