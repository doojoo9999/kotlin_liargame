package org.example.dnf_raid.util

private const val EOK_UNIT = 1e8
private const val MAN_UNIT = 1e4

fun toEok(value: Double): Double = value / EOK_UNIT
fun toEok(value: Long): Double = value / EOK_UNIT
fun toMan(value: Double): Double = value / MAN_UNIT
fun toMan(value: Long): Double = value / MAN_UNIT
