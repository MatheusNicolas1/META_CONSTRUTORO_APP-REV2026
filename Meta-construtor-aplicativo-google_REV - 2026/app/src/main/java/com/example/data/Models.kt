package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "obras")
data class Obra(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val location: String,
    val engineerName: String,
    val progress: Int = 0, // progress percentage (e.g., 0 to 100)
    val startDate: String,
    val endDate: String,
    val isActive: Boolean = true
)

@Entity(tableName = "rdo_reports")
data class RdoReport(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val obraId: Long,
    val obraTitle: String,
    val reportDate: String,                // e.g. "11/06/2026"
    val periodType: String,                // e.g. "Integral", "Manhã", "Tarde", "Noite", "Extra"
    val weatherCondition: String,          // e.g. "Ensolarado", "Sem Chuva", "Chuvoso", "Parcialmente Nublado", "Instável"
    val isTeamIdle: Boolean = false,       // Equipe ociosa or not
    val status: String,                    // e.g. "Aprovado", "Rascunho", "Em Análise"
    val crewsJson: String,                 // Comma-separated or JSON list of present crews: e.g. "José (8h), Marcos (6h)"
    val activitiesJson: String,            // Planned/executed activities
    val extraActivitiesJson: String,       // Atividades extras: e.g. "Escavação manual, Assentamento de tubos adicionais"
    val equipmentsJson: String,            // Equipments used: e.g. "Betoneira (1), Caminhão (1)"
    val observations: String = "",         // General commments
    val issuesJson: String = "",           // Register of events/problems: e.g. "Falta de energia das 14h às 15h"
    val attachmentsCount: Int = 0,         // Simulated count of uploads
    val timestamp: Long = System.currentTimeMillis()
)
