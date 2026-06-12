package com.example.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ObraDao {
    @Query("SELECT * FROM obras ORDER BY id DESC")
    fun getAllObrasFlow(): Flow<List<Obra>>

    @Query("SELECT * FROM obras WHERE id = :id LIMIT 1")
    suspend fun getObraById(id: Long): Obra?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertObra(obra: Obra): Long

    @Update
    suspend fun updateObra(obra: Obra)

    @Delete
    suspend fun deleteObra(obra: Obra)
}

@Dao
interface RdoDao {
    @Query("SELECT * FROM rdo_reports ORDER BY timestamp DESC")
    fun getAllReportsFlow(): Flow<List<RdoReport>>

    @Query("SELECT * FROM rdo_reports WHERE obraId = :obraId ORDER BY timestamp DESC")
    fun getReportsForObraFlow(obraId: Long): Flow<List<RdoReport>>

    @Query("SELECT * FROM rdo_reports WHERE id = :id LIMIT 1")
    suspend fun getReportById(id: Long): RdoReport?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReport(report: RdoReport): Long

    @Update
    suspend fun updateReport(report: RdoReport)

    @Delete
    suspend fun deleteReport(report: RdoReport)
}
