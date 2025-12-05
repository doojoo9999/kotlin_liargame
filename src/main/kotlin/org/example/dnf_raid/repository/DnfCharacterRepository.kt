package org.example.dnf_raid.repository

import org.example.dnf_raid.model.DnfCharacterEntity
import org.springframework.data.jpa.repository.JpaRepository

interface DnfCharacterRepository : JpaRepository<DnfCharacterEntity, String>
