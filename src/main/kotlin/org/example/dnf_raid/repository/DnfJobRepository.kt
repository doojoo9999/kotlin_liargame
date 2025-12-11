package org.example.dnf_raid.repository

import org.example.dnf_raid.model.DnfJobEntity
import org.springframework.data.jpa.repository.JpaRepository

interface DnfJobRepository : JpaRepository<DnfJobEntity, String>
