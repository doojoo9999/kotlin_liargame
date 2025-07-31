package org.example.kotlin_liargame.domain.user.controller

import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
import org.example.kotlin_liargame.domain.user.service.UserService
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/user")
class UserController (
    private val userService: UserService
) {

    @PostMapping("/add")
    fun addUser(@RequestBody req: UserAddRequest) {

        userService.createUser(req)

    }

}
