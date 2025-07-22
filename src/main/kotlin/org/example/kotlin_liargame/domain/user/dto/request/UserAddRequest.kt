package org.example.kotlin_liargame.domain.user.dto.request

import org.example.kotlin_liargame.domain.user.model.UserEntity

data class UserAddRequest (
    val nickname : String,
    val profileImgUrl : String
){
    fun to() : UserEntity {
        return UserEntity(
            nickname = this.nickname,
            profileImgUrl = this.profileImgUrl
        )
    }
}