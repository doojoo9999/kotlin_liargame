package org.example.kotlin_liargame.domain.game.dto.request

data class SubmitDefenseRequest(
    val gameNumber: Int,
    val defenseText: String
) {
    fun validate() {
        require(gameNumber > 0) { "Game number must be positive" }
        require(defenseText.isNotBlank()) { "Defense text cannot be empty" }
        require(defenseText.length <= 200) { "Defense text too long (max 200 characters)" }
    }
}