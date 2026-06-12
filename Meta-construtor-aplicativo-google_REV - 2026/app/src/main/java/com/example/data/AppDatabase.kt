package com.example.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(entities = [Obra::class, RdoReport::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun obraDao(): ObraDao
    abstract fun rdoDao(): RdoDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "metw_construtor_database"
                )
                .addCallback(AppDatabaseCallback(scope))
                .build()
                INSTANCE = instance
                instance
            }
        }
    }

    private class AppDatabaseCallback(
        private val scope: CoroutineScope
    ) : RoomDatabase.Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            INSTANCE?.let { database ->
                scope.launch(Dispatchers.IO) {
                    populateDb(database.obraDao(), database.rdoDao())
                }
            }
        }

        suspend fun populateDb(obraDao: ObraDao, rdoDao: RdoDao) {
            // Clean before prepopulating (safeguard)
            // Pre-add Obras
            val id1 = obraDao.insertObra(
                Obra(
                    title = "Creche Padrão FNDE",
                    location = "Salvador - BA",
                    engineerName = "Eng. Matheus Nicolas",
                    progress = 45,
                    startDate = "05/01/2026",
                    endDate = "30/11/2026",
                    isActive = true
                )
            )

            val id2 = obraDao.insertObra(
                Obra(
                    title = "Caprosa Delicatessen",
                    location = "Lauro de Freitas - BA",
                    engineerName = "Eng. Matheus Nicolas",
                    progress = 80,
                    startDate = "12/04/2026",
                    endDate = "23/06/2026",
                    isActive = true
                )
            )

            val id3 = obraDao.insertObra(
                Obra(
                    title = "Edifício Horizon",
                    location = "Feira de Santana - BA",
                    engineerName = "Eng. Daniel Andrade",
                    progress = 15,
                    startDate = "01/02/2026",
                    endDate = "31/12/2027",
                    isActive = true
                )
            )

            // Pre-add RDO Reports matching screenshot details
            rdoDao.insertReport(
                RdoReport(
                    id = 55,
                    obraId = id1,
                    obraTitle = "Creche Padrão FNDE",
                    reportDate = "11/06/2026",
                    periodType = "Integral",
                    weatherCondition = "Chuvoso",
                    isTeamIdle = false,
                    status = "Aprovado",
                    crewsJson = "José (8h), Marcos (8h), Felipe (8h)",
                    activitiesJson = "Alvenaria estrutural, concretagem de vigas",
                    extraActivitiesJson = "Limpeza de canaletas de escoamento acumuladas",
                    equipmentsJson = "Betoneira (1), Caminhão Basculante (1)",
                    observations = "Chuva torrencial pela manhã atrasou o início da concretagem das vigas em cerca de 45 minutos. Equipe realizou as fôrmas no período vespertino compensando o atraso inicial.",
                    issuesJson = "Chuva pesada acumulada das 08h às 09:30",
                    attachmentsCount = 3
                )
            )

            rdoDao.insertReport(
                RdoReport(
                    id = 33,
                    obraId = id2,
                    obraTitle = "Caprosa Delicatessen",
                    reportDate = "10/06/2026",
                    periodType = "Integral",
                    weatherCondition = "Parcialmente Nublado",
                    isTeamIdle = false,
                    status = "Rascunho",
                    crewsJson = "Geraldo (8h), Anderson (8h)",
                    activitiesJson = "Assentamento cerâmico no salão principal, pintura de tetos",
                    extraActivitiesJson = "Nenhuma",
                    equipmentsJson = "Compactador manual, Andaimes (2)",
                    observations = "Obra bem adiantada. A colocação de louças sanitárias iniciou hoje. Sem intercorrências de segurança.",
                    issuesJson = "Nenhum",
                    attachmentsCount = 1
                )
            )

            rdoDao.insertReport(
                RdoReport(
                    id = 24,
                    obraId = id3,
                    obraTitle = "Edifício Horizon",
                    reportDate = "05/06/2026",
                    periodType = "Manhã",
                    weatherCondition = "Ensolarado",
                    isTeamIdle = true,
                    status = "Rascunho",
                    crewsJson = "Carlos (4h)",
                    activitiesJson = "Marcação de estacas do bloco B",
                    extraActivitiesJson = "Nenhuma",
                    equipmentsJson = "Teodolito eletrônico",
                    observations = "A equipe ficou ociosa no final do período devido a atraso na entrega do concreto usinado pela fornecedora externa Supermix.",
                    issuesJson = "Atraso no fornecimento de concreto (1.5h de espera)",
                    attachmentsCount = 0
                )
            )
        }
    }
}
