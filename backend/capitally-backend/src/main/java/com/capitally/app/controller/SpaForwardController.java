package com.capitally.app.controller;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {
    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    public String root() { return "forward:/index.html"; }

    @GetMapping(value = "/{p1:[^\\.]+}", produces = MediaType.TEXT_HTML_VALUE)
    public String level1() { return "forward:/index.html"; }

    @GetMapping(value = "/{p1:[^\\.]+}/{p2:[^\\.]+}", produces = MediaType.TEXT_HTML_VALUE)
    public String level2() { return "forward:/index.html"; }

    @GetMapping(value = "/{p1:[^\\.]+}/{p2:[^\\.]+}/{p3:[^\\.]+}", produces = MediaType.TEXT_HTML_VALUE)
    public String level3() { return "forward:/index.html"; }
}
