package org.example.kotlin_liargame.domain.image.controller

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping

@Controller
class ImagePageController {

    @GetMapping("/img", "/img/")
    fun uploadPage(): String {
        return "forward:/img/index.html"
    }
}
