export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_type: string
          created_at: string
          description: string
          icon_url: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          created_at?: string
          description: string
          icon_url?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          created_at?: string
          description?: string
          icon_url?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          anonymous_id: string | null
          created_at: string | null
          environment: string | null
          error: string | null
          event: string | null
          id: string
          org_id: string | null
          properties: Json | null
          ref: string | null
          referrer: string | null
          request_id: string | null
          role: string | null
          session_id: string | null
          source: string | null
          success: boolean | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string | null
          environment?: string | null
          error?: string | null
          event?: string | null
          id?: string
          org_id?: string | null
          properties?: Json | null
          ref?: string | null
          referrer?: string | null
          request_id?: string | null
          role?: string | null
          session_id?: string | null
          source?: string | null
          success?: boolean | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string | null
          environment?: string | null
          error?: string | null
          event?: string | null
          id?: string
          org_id?: string | null
          properties?: Json | null
          ref?: string | null
          referrer?: string | null
          request_id?: string | null
          role?: string | null
          session_id?: string | null
          source?: string | null
          success?: boolean | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "analytics_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades: {
        Row: {
          categoria: string | null
          created_at: string
          data: string
          descricao: string | null
          hora: string
          id: string
          notificado: boolean | null
          obra_id: string | null
          org_id: string
          prioridade: string
          quantidade_prevista: number | null
          responsavel: string | null
          status: string
          titulo: string
          unidade_medida: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data: string
          descricao?: string | null
          hora?: string
          id?: string
          notificado?: boolean | null
          obra_id?: string | null
          org_id: string
          prioridade?: string
          quantidade_prevista?: number | null
          responsavel?: string | null
          status?: string
          titulo: string
          unidade_medida?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          hora?: string
          id?: string
          notificado?: boolean | null
          obra_id?: string | null
          org_id?: string
          prioridade?: string
          quantidade_prevista?: number | null
          responsavel?: string | null
          status?: string
          titulo?: string
          unidade_medida?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "atividades_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          checklist_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          descricao: string | null
          id: string
          obrigatorio: boolean
          observacoes: string | null
          prioridade: string
          requer_anexo: boolean
          status: string
          titulo: string
        }
        Insert: {
          checklist_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          obrigatorio?: boolean
          observacoes?: string | null
          prioridade: string
          requer_anexo?: boolean
          status?: string
          titulo: string
        }
        Update: {
          checklist_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          obrigatorio?: boolean
          observacoes?: string | null
          prioridade?: string
          requer_anexo?: boolean
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          aprovado_por_id: string | null
          categoria: string
          completed_at: string | null
          created_at: string
          data_aprovacao: string | null
          data_vencimento: string | null
          descricao: string | null
          id: string
          obra_id: string
          org_id: string | null
          progresso_completo: number | null
          progresso_total: number | null
          responsavel_id: string
          signature_data: string | null
          signature_email: string | null
          signature_name: string | null
          signed_at: string | null
          started_at: string | null
          status: string
          template_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          aprovado_por_id?: string | null
          categoria: string
          completed_at?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          obra_id: string
          org_id?: string | null
          progresso_completo?: number | null
          progresso_total?: number | null
          responsavel_id: string
          signature_data?: string | null
          signature_email?: string | null
          signature_name?: string | null
          signed_at?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          aprovado_por_id?: string | null
          categoria?: string
          completed_at?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          obra_id?: string
          org_id?: string | null
          progresso_completo?: number | null
          progresso_total?: number | null
          responsavel_id?: string
          signature_data?: string | null
          signature_email?: string | null
          signature_name?: string | null
          signed_at?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "checklists_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cep: string | null
          cidade: string | null
          cpf_cnpj: string | null
          criado_em: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          telefone: string | null
          tipo: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          criado_em?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          telefone?: string | null
          tipo: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          criado_em?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          tipo?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          assunto: string
          created_at: string | null
          email: string
          empresa: string | null
          id: string
          mensagem: string
          nome: string
          status: string | null
          telefone: string | null
        }
        Insert: {
          assunto: string
          created_at?: string | null
          email: string
          empresa?: string | null
          id?: string
          mensagem: string
          nome: string
          status?: string | null
          telefone?: string | null
        }
        Update: {
          assunto?: string
          created_at?: string | null
          email?: string
          empresa?: string | null
          id?: string
          mensagem?: string
          nome?: string
          status?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      contatos: {
        Row: {
          cliente_id: string
          data: string | null
          descricao: string | null
          id: string
          tipo: string | null
        }
        Insert: {
          cliente_id: string
          data?: string | null
          descricao?: string | null
          id?: string
          tipo?: string | null
        }
        Update: {
          cliente_id?: string
          data?: string | null
          descricao?: string | null
          id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contatos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          arquivo_pdf_path: string | null
          assinado_em: string | null
          criado_em: string | null
          id: string
          link_assinatura: string | null
          numero: string | null
          projeto_id: string
          proposta_id: string | null
          status: string | null
          valor_total: number | null
        }
        Insert: {
          arquivo_pdf_path?: string | null
          assinado_em?: string | null
          criado_em?: string | null
          id?: string
          link_assinatura?: string | null
          numero?: string | null
          projeto_id: string
          proposta_id?: string | null
          status?: string | null
          valor_total?: number | null
        }
        Update: {
          arquivo_pdf_path?: string | null
          assinado_em?: string | null
          criado_em?: string | null
          id?: string
          link_assinatura?: string | null
          numero?: string | null
          projeto_id?: string
          proposta_id?: string | null
          status?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_percentage: number | null
          discount_type: string | null
          discount_value: number | null
          id: string
          is_active: boolean
          times_used: number
          updated_at: string
          usage_limit: number | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_percentage?: number | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_active?: boolean
          times_used?: number
          updated_at?: string
          usage_limit?: number | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_percentage?: number | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_active?: boolean
          times_used?: number
          updated_at?: string
          usage_limit?: number | null
          valid_until?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string | null
          id: string
          org_id: string
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          description?: string | null
          id?: string
          org_id: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          id?: string
          org_id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "credit_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          categoria: string
          checklist_id: string | null
          checklist_item_id: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          obra_id: string | null
          org_id: string | null
          rdo_id: string | null
          tamanho: number | null
          tipo: string
          uploaded_by: string
          url: string
        }
        Insert: {
          categoria: string
          checklist_id?: string | null
          checklist_item_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          obra_id?: string | null
          org_id?: string | null
          rdo_id?: string | null
          tamanho?: number | null
          tipo: string
          uploaded_by: string
          url: string
        }
        Update: {
          categoria?: string
          checklist_id?: string | null
          checklist_item_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          obra_id?: string | null
          org_id?: string | null
          rdo_id?: string | null
          tamanho?: number | null
          tipo?: string
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "documentos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_rdo_id_fkey"
            columns: ["rdo_id"]
            isOneToOne: false
            referencedRelation: "rdos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos: {
        Row: {
          categoria: string
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          org_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          org_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          org_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "equipamentos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      equipes: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          funcao: string
          id: string
          nome: string
          org_id: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          funcao: string
          id?: string
          nome: string
          org_id?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          funcao?: string
          id?: string
          nome?: string
          org_id?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "equipes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approval_status: string
          component_id: string | null
          cost_category: string
          created_at: string
          date_of_expense: string
          general_manager_approved_at: string | null
          general_manager_approver_id: string | null
          id: string
          invoice_file_url: string | null
          invoice_number: string
          manager_approved_at: string | null
          manager_approver_id: string | null
          notes: string | null
          obra_id: string
          org_id: string
          rejection_reason: string | null
          supplier_name: string
          team_member_id: string | null
          updated_at: string
          user_submitting_id: string
        }
        Insert: {
          amount: number
          approval_status?: string
          component_id?: string | null
          cost_category: string
          created_at?: string
          date_of_expense: string
          general_manager_approved_at?: string | null
          general_manager_approver_id?: string | null
          id?: string
          invoice_file_url?: string | null
          invoice_number: string
          manager_approved_at?: string | null
          manager_approver_id?: string | null
          notes?: string | null
          obra_id: string
          org_id: string
          rejection_reason?: string | null
          supplier_name: string
          team_member_id?: string | null
          updated_at?: string
          user_submitting_id: string
        }
        Update: {
          amount?: number
          approval_status?: string
          component_id?: string | null
          cost_category?: string
          created_at?: string
          date_of_expense?: string
          general_manager_approved_at?: string | null
          general_manager_approver_id?: string | null
          id?: string
          invoice_file_url?: string | null
          invoice_number?: string
          manager_approved_at?: string | null
          manager_approver_id?: string | null
          notes?: string | null
          obra_id?: string
          org_id?: string
          rejection_reason?: string | null
          supplier_name?: string
          team_member_id?: string | null
          updated_at?: string
          user_submitting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "expenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          created_at: string | null
          id: string
          mensagem: string
          nota_satisfacao: number | null
          org_id: string | null
          status: string | null
          tipo: string
          titulo: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mensagem: string
          nota_satisfacao?: number | null
          org_id?: string | null
          status?: string | null
          tipo: string
          titulo?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mensagem?: string
          nota_satisfacao?: number | null
          org_id?: string | null
          status?: string | null
          tipo?: string
          titulo?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "feedbacks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "admin_churn_risk_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "admin_user_segments_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "public_profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "admin_churn_risk_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "admin_user_segments_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "public_profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          categoria: string
          cnpj: string | null
          contato: string
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          org_id: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          categoria: string
          cnpj?: string | null
          contato: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          org_id?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          cnpj?: string | null
          contato?: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          org_id?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fornecedores_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_emails: {
        Row: {
          anexos: string[] | null
          assunto: string | null
          cliente_id: string | null
          destinatario: string
          enviado_em: string | null
          gmail_message_id: string | null
          id: string
          projeto_id: string | null
          status: string | null
          tipo: string
        }
        Insert: {
          anexos?: string[] | null
          assunto?: string | null
          cliente_id?: string | null
          destinatario: string
          enviado_em?: string | null
          gmail_message_id?: string | null
          id?: string
          projeto_id?: string | null
          status?: string | null
          tipo: string
        }
        Update: {
          anexos?: string[] | null
          assunto?: string | null
          cliente_id?: string | null
          destinatario?: string
          enviado_em?: string | null
          gmail_message_id?: string | null
          id?: string
          projeto_id?: string | null
          status?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_emails_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_emails_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          created_at: string
          credentials: Json
          id: string
          last_sync: string | null
          org_id: string
          service: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          credentials?: Json
          id?: string
          last_sync?: string | null
          org_id: string
          service: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          credentials?: Json
          id?: string
          last_sync?: string | null
          org_id?: string
          service?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_financeiras: {
        Row: {
          ano: number | null
          id: string
          mes: number | null
          meta_valor: number | null
        }
        Insert: {
          ano?: number | null
          id?: string
          mes?: number | null
          meta_valor?: number | null
        }
        Update: {
          ano?: number | null
          id?: string
          mes?: number | null
          meta_valor?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          route: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          route?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          route?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      obras: {
        Row: {
          area: string | null
          categoria: string | null
          cliente: string
          cover_image_url: string | null
          created_at: string
          data_inicio: string
          descricao: string | null
          id: string
          is_public: boolean
          localizacao: string
          nome: string
          observacoes: string | null
          org_id: string
          previsao_termino: string
          prioridade: string | null
          progresso: number
          responsavel: string
          slug: string | null
          status: Database["public"]["Enums"]["obra_status"]
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: string | null
          categoria?: string | null
          cliente: string
          cover_image_url?: string | null
          created_at?: string
          data_inicio: string
          descricao?: string | null
          id?: string
          is_public?: boolean
          localizacao: string
          nome: string
          observacoes?: string | null
          org_id: string
          previsao_termino: string
          prioridade?: string | null
          progresso?: number
          responsavel: string
          slug?: string | null
          status?: Database["public"]["Enums"]["obra_status"]
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string | null
          categoria?: string | null
          cliente?: string
          cover_image_url?: string | null
          created_at?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          is_public?: boolean
          localizacao?: string
          nome?: string
          observacoes?: string | null
          org_id?: string
          previsao_termino?: string
          prioridade?: string | null
          progresso?: number
          responsavel?: string
          slug?: string | null
          status?: Database["public"]["Enums"]["obra_status"]
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "obras_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_credits: {
        Row: {
          created_at: string
          id: string
          last_reset: string
          org_id: string
          plan_type: string
          rdo_credits_balance: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reset?: string
          org_id: string
          plan_type?: string
          rdo_credits_balance?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reset?: string
          org_id?: string
          plan_type?: string
          rdo_credits_balance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_credits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_credits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["org_member_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          org_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["org_member_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["org_member_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          descricao: string | null
          forma_pagamento: string | null
          id: string
          numero_nf: string | null
          parcela_num: number | null
          projeto_id: string
          recebido_em: string | null
          status: string | null
          valor: number
          vencimento: string
        }
        Insert: {
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          numero_nf?: string | null
          parcela_num?: number | null
          projeto_id: string
          recebido_em?: string | null
          status?: string | null
          valor: number
          vencimento: string
        }
        Update: {
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          numero_nf?: string | null
          parcela_num?: number | null
          projeto_id?: string
          recebido_em?: string | null
          status?: string | null
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string
          display_order: number
          features: Json
          id: string
          is_active: boolean
          is_popular: boolean
          max_obras: number | null
          max_users: number | null
          monthly_price_cents: number | null
          monthly_rdos: number | null
          name: string
          slug: string
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          trial_days: number | null
          updated_at: string
          yearly_price_cents: number | null
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          max_obras?: number | null
          max_users?: number | null
          monthly_price_cents?: number | null
          monthly_rdos?: number | null
          name: string
          slug: string
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          trial_days?: number | null
          updated_at?: string
          yearly_price_cents?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          max_obras?: number | null
          max_users?: number | null
          monthly_price_cents?: number | null
          monthly_rdos?: number | null
          name?: string
          slug?: string
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          trial_days?: number | null
          updated_at?: string
          yearly_price_cents?: number | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          category: string | null
          comments_count: number
          content: string
          created_at: string
          id: string
          likes_count: number
          location: string | null
          media_type: string | null
          media_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          location?: string | null
          media_type?: string | null
          media_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          location?: string | null
          media_type?: string | null
          media_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pranchas: {
        Row: {
          arquivo_path: string | null
          emitido_em: string | null
          id: string
          numero: string | null
          projeto_id: string
          revisao: string | null
          status: string | null
          titulo: string | null
        }
        Insert: {
          arquivo_path?: string | null
          emitido_em?: string | null
          id?: string
          numero?: string | null
          projeto_id: string
          revisao?: string | null
          status?: string | null
          titulo?: string | null
        }
        Update: {
          arquivo_path?: string | null
          emitido_em?: string | null
          id?: string
          numero?: string | null
          projeto_id?: string
          revisao?: string | null
          status?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pranchas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          company_address: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string
          followers_count: number | null
          following_count: number | null
          has_seen_onboarding: boolean | null
          hide_signature: boolean
          id: string
          is_public: boolean | null
          name: string
          phone: string | null
          plan_type: string
          position: string | null
          posts_count: number | null
          referral_bonus_days: number
          referral_code: string | null
          slug: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          terms_accepted_at: string
          terms_accepted_ip: string | null
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          company_address?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email: string
          followers_count?: number | null
          following_count?: number | null
          has_seen_onboarding?: boolean | null
          hide_signature?: boolean
          id: string
          is_public?: boolean | null
          name: string
          phone?: string | null
          plan_type?: string
          position?: string | null
          posts_count?: number | null
          referral_bonus_days?: number
          referral_code?: string | null
          slug?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          terms_accepted_at?: string
          terms_accepted_ip?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          company_address?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string
          followers_count?: number | null
          following_count?: number | null
          has_seen_onboarding?: boolean | null
          hide_signature?: boolean
          id?: string
          is_public?: boolean | null
          name?: string
          phone?: string | null
          plan_type?: string
          position?: string | null
          posts_count?: number | null
          referral_bonus_days?: number
          referral_code?: string | null
          slug?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          terms_accepted_at?: string
          terms_accepted_ip?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      projetos: {
        Row: {
          area_total: number | null
          cliente_id: string
          criado_em: string | null
          data_conclusao: string | null
          data_inicio: string | null
          descricao_empreendimento: string | null
          endereco_obra: string | null
          id: string
          nome: string
          prazo_entrega: string | null
          status: string | null
          tipo_estrutura: string | null
          valor_contratado: number | null
        }
        Insert: {
          area_total?: number | null
          cliente_id: string
          criado_em?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao_empreendimento?: string | null
          endereco_obra?: string | null
          id?: string
          nome: string
          prazo_entrega?: string | null
          status?: string | null
          tipo_estrutura?: string | null
          valor_contratado?: number | null
        }
        Update: {
          area_total?: number | null
          cliente_id?: string
          criado_em?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao_empreendimento?: string | null
          endereco_obra?: string | null
          id?: string
          nome?: string
          prazo_entrega?: string | null
          status?: string | null
          tipo_estrutura?: string | null
          valor_contratado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projetos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas: {
        Row: {
          aprovada_em: string | null
          arquivo_pdf_path: string | null
          condicao_pagamento_1_pct: number | null
          condicao_pagamento_2_pct: number | null
          criado_em: string | null
          enviada_em: string | null
          escopo_acompanhamento: boolean | null
          escopo_art: boolean | null
          escopo_fabricacao: boolean | null
          escopo_modelagem_3d: boolean | null
          escopo_projeto_estrutural: boolean | null
          escopo_quantitativo: boolean | null
          id: string
          numero: string | null
          prazo_entrega_dias: number | null
          projeto_id: string
          status: string | null
          validade_dias: number | null
          valor_total: number | null
          versao: number | null
        }
        Insert: {
          aprovada_em?: string | null
          arquivo_pdf_path?: string | null
          condicao_pagamento_1_pct?: number | null
          condicao_pagamento_2_pct?: number | null
          criado_em?: string | null
          enviada_em?: string | null
          escopo_acompanhamento?: boolean | null
          escopo_art?: boolean | null
          escopo_fabricacao?: boolean | null
          escopo_modelagem_3d?: boolean | null
          escopo_projeto_estrutural?: boolean | null
          escopo_quantitativo?: boolean | null
          id?: string
          numero?: string | null
          prazo_entrega_dias?: number | null
          projeto_id: string
          status?: string | null
          validade_dias?: number | null
          valor_total?: number | null
          versao?: number | null
        }
        Update: {
          aprovada_em?: string | null
          arquivo_pdf_path?: string | null
          condicao_pagamento_1_pct?: number | null
          condicao_pagamento_2_pct?: number | null
          criado_em?: string | null
          enviada_em?: string | null
          escopo_acompanhamento?: boolean | null
          escopo_art?: boolean | null
          escopo_fabricacao?: boolean | null
          escopo_modelagem_3d?: boolean | null
          escopo_projeto_estrutural?: boolean | null
          escopo_quantitativo?: boolean | null
          id?: string
          numero?: string | null
          prazo_entrega_dias?: number | null
          projeto_id?: string
          status?: string | null
          validade_dias?: number | null
          valor_total?: number | null
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "propostas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      rdo_atividades: {
        Row: {
          categoria: string
          created_at: string
          id: string
          is_extra: boolean
          justificativa: string | null
          nome: string
          observacoes: string | null
          percentual_concluido: number
          quantidade: number
          rdo_id: string
          status: string
          unidade_medida: string
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          is_extra?: boolean
          justificativa?: string | null
          nome: string
          observacoes?: string | null
          percentual_concluido?: number
          quantidade: number
          rdo_id: string
          status: string
          unidade_medida: string
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          is_extra?: boolean
          justificativa?: string | null
          nome?: string
          observacoes?: string | null
          percentual_concluido?: number
          quantidade?: number
          rdo_id?: string
          status?: string
          unidade_medida?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdo_atividades_rdo_id_fkey"
            columns: ["rdo_id"]
            isOneToOne: false
            referencedRelation: "rdos"
            referencedColumns: ["id"]
          },
        ]
      }
      rdo_equipamentos: {
        Row: {
          causou_ociosidade: boolean | null
          created_at: string
          descricao_problema: string | null
          equipamento_id: string
          horas_parada: number | null
          horas_uso: number
          id: string
          observacoes: string | null
          rdo_id: string
          status: string
        }
        Insert: {
          causou_ociosidade?: boolean | null
          created_at?: string
          descricao_problema?: string | null
          equipamento_id: string
          horas_parada?: number | null
          horas_uso: number
          id?: string
          observacoes?: string | null
          rdo_id: string
          status: string
        }
        Update: {
          causou_ociosidade?: boolean | null
          created_at?: string
          descricao_problema?: string | null
          equipamento_id?: string
          horas_parada?: number | null
          horas_uso?: number
          id?: string
          observacoes?: string | null
          rdo_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdo_equipamentos_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdo_equipamentos_rdo_id_fkey"
            columns: ["rdo_id"]
            isOneToOne: false
            referencedRelation: "rdos"
            referencedColumns: ["id"]
          },
        ]
      }
      rdo_equipes: {
        Row: {
          created_at: string
          equipe_id: string
          horas_ociosas: number | null
          horas_trabalho: number
          id: string
          presente: boolean
          rdo_id: string
        }
        Insert: {
          created_at?: string
          equipe_id: string
          horas_ociosas?: number | null
          horas_trabalho: number
          id?: string
          presente?: boolean
          rdo_id: string
        }
        Update: {
          created_at?: string
          equipe_id?: string
          horas_ociosas?: number | null
          horas_trabalho?: number
          id?: string
          presente?: boolean
          rdo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdo_equipes_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdo_equipes_rdo_id_fkey"
            columns: ["rdo_id"]
            isOneToOne: false
            referencedRelation: "rdos"
            referencedColumns: ["id"]
          },
        ]
      }
      rdo_notas: {
        Row: {
          created_at: string
          id: string
          org_id: string
          rdo_id: string
          texto: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          rdo_id: string
          texto: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          rdo_id?: string
          texto?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdo_notas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "rdo_notas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdo_notas_rdo_id_fkey"
            columns: ["rdo_id"]
            isOneToOne: false
            referencedRelation: "rdos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdo_notas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_churn_risk_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rdo_notas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_segments_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rdo_notas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdo_notas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdo_notas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdo_notas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      rdos: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          aprovado_por_id: string | null
          clima: string
          created_at: string
          criado_por_id: string
          data: string
          data_aprovacao: string | null
          detalhes: Json | null
          equipe_ociosa: boolean
          id: string
          motivo_rejeicao: string | null
          numero: number
          obra_id: string
          observacoes: string | null
          org_id: string
          periodo: string
          rejection_reason: string | null
          status: string
          tempo_ocioso: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          aprovado_por_id?: string | null
          clima: string
          created_at?: string
          criado_por_id: string
          data: string
          data_aprovacao?: string | null
          detalhes?: Json | null
          equipe_ociosa?: boolean
          id?: string
          motivo_rejeicao?: string | null
          numero?: number
          obra_id: string
          observacoes?: string | null
          org_id: string
          periodo: string
          rejection_reason?: string | null
          status?: string
          tempo_ocioso?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          aprovado_por_id?: string | null
          clima?: string
          created_at?: string
          criado_por_id?: string
          data?: string
          data_aprovacao?: string | null
          detalhes?: Json | null
          equipe_ociosa?: boolean
          id?: string
          motivo_rejeicao?: string | null
          numero?: number
          obra_id?: string
          observacoes?: string | null
          org_id?: string
          periodo?: string
          rejection_reason?: string | null
          status?: string
          tempo_ocioso?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "rdos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_granted: boolean
          bonus_type: string | null
          created_at: string
          id: string
          new_user_id: string
          referrer_id: string
        }
        Insert: {
          bonus_granted?: boolean
          bonus_type?: string | null
          created_at?: string
          id?: string
          new_user_id: string
          referrer_id: string
        }
        Update: {
          bonus_granted?: boolean
          bonus_type?: string | null
          created_at?: string
          id?: string
          new_user_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      signature_access_log: {
        Row: {
          access_type: string
          accessed_at: string | null
          accessed_by: string
          checklist_id: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          accessed_by: string
          checklist_id?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          accessed_by?: string
          checklist_id?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_access_log_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      social_shares: {
        Row: {
          created_at: string
          id: string
          obra_id: string | null
          platform: string
          post_url: string
          rdo_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          obra_id?: string | null
          platform: string
          post_url: string
          rdo_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          obra_id?: string | null
          platform?: string
          post_url?: string
          rdo_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_shares_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_shares_rdo_id_fkey"
            columns: ["rdo_id"]
            isOneToOne: false
            referencedRelation: "rdos"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          api_version: string | null
          created_at: string
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          api_version?: string | null
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          api_version?: string | null
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          org_id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          org_id: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits_balance: number
          id: string
          last_shared_at: string | null
          plan_type: string
          total_shared: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_balance?: number
          id?: string
          last_shared_at?: string | null
          plan_type?: string
          total_shared?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_balance?: number
          id?: string
          last_shared_at?: string | null
          plan_type?: string
          total_shared?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          metadata: Json | null
          target_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          metadata?: Json | null
          target_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          target_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_backup: boolean
          backup_frequency: string
          biometric_login: boolean
          budget_notifications: boolean
          cloud_sync: boolean
          created_at: string
          deadline_alerts: boolean
          email_notifications: boolean
          font_size: string
          id: string
          language: string
          min_password_length: number
          notification_end_time: string
          notification_start_time: string
          password_expiry_days: number
          primary_color: string
          push_notifications: boolean
          session_timeout: boolean
          theme: string
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
          weekly_reports: boolean
        }
        Insert: {
          auto_backup?: boolean
          backup_frequency?: string
          biometric_login?: boolean
          budget_notifications?: boolean
          cloud_sync?: boolean
          created_at?: string
          deadline_alerts?: boolean
          email_notifications?: boolean
          font_size?: string
          id?: string
          language?: string
          min_password_length?: number
          notification_end_time?: string
          notification_start_time?: string
          password_expiry_days?: number
          primary_color?: string
          push_notifications?: boolean
          session_timeout?: boolean
          theme?: string
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
          weekly_reports?: boolean
        }
        Update: {
          auto_backup?: boolean
          backup_frequency?: string
          biometric_login?: boolean
          budget_notifications?: boolean
          cloud_sync?: boolean
          created_at?: string
          deadline_alerts?: boolean
          email_notifications?: boolean
          font_size?: string
          id?: string
          language?: string
          min_password_length?: number
          notification_end_time?: string
          notification_start_time?: string
          password_expiry_days?: number
          primary_color?: string
          push_notifications?: boolean
          session_timeout?: boolean
          theme?: string
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
          weekly_reports?: boolean
        }
        Relationships: []
      }
      welcome_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          shown: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          shown?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          shown?: boolean
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_analytics_events_unified_view: {
        Row: {
          anonymous_id: string | null
          created_at: string | null
          environment: string | null
          error: string | null
          event: string | null
          event_id: string | null
          org_id: string | null
          origin_table: string | null
          properties: Json | null
          ref: string | null
          referrer: string | null
          request_id: string | null
          role: string | null
          route: string | null
          session_id: string | null
          source: string | null
          success: boolean | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Relationships: []
      }
      admin_campaign_performance_view: {
        Row: {
          anonymous_visitors: number | null
          auth_events: number | null
          billing_events: number | null
          first_seen_at: string | null
          identified_users: number | null
          last_seen_at: string | null
          page_views: number | null
          ref: string | null
          total_events: number | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Relationships: []
      }
      admin_checkout_funnel_view: {
        Row: {
          anonymous_visitors: number | null
          billing_events: number | null
          checkout_views: number | null
          event_date: string | null
          identified_users: number | null
          pricing_views: number | null
        }
        Relationships: []
      }
      admin_churn_risk_view: {
        Row: {
          activity_segment: string | null
          first_event_at: string | null
          interactions: number | null
          last_event_at: string | null
          plan_type: string | null
          risk_level: string | null
          roles: string[] | null
          route_views: number | null
          total_events: number | null
          user_id: string | null
        }
        Relationships: []
      }
      admin_funnel_daily_view: {
        Row: {
          active_users: number | null
          checkout_events: number | null
          coupon_events: number | null
          event_date: string | null
          interactions: number | null
          route_views: number | null
          signups: number | null
          subscription_events: number | null
        }
        Relationships: []
      }
      admin_org_usage_summary_view: {
        Row: {
          active_members: number | null
          interactions: number | null
          last_event_at: string | null
          org_created_at: string | null
          org_id: string | null
          org_name: string | null
          org_slug: string | null
          route_views: number | null
          total_events: number | null
          total_members: number | null
        }
        Relationships: []
      }
      admin_route_metrics_view: {
        Row: {
          event_date: string | null
          first_seen_at: string | null
          last_seen_at: string | null
          route: string | null
          total_views: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      admin_user_activity_summary_view: {
        Row: {
          distinct_routes: number | null
          failed_events: number | null
          first_event_at: string | null
          interactions: number | null
          last_event_at: string | null
          org_id: string | null
          route_views: number | null
          total_events: number | null
          user_id: string | null
        }
        Relationships: []
      }
      admin_user_segments_view: {
        Row: {
          activity_segment: string | null
          first_event_at: string | null
          interactions: number | null
          last_event_at: string | null
          plan_type: string | null
          roles: string[] | null
          route_views: number | null
          total_events: number | null
          user_created_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      admin_users_view: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          phone: string | null
          plan_type: string | null
          roles: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
          phone?: string | null
          plan_type?: string | null
          roles?: never
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
          phone?: string | null
          plan_type?: string | null
          roles?: never
        }
        Relationships: []
      }
      cronograma_vs_realizado: {
        Row: {
          atividade: string | null
          atividade_id: string | null
          data_planejada: string | null
          data_realizada: string | null
          dias_desvio: number | null
          obra_id: string | null
          obra_nome: string | null
          org_id: string | null
          quantidade_prevista: number | null
          quantidade_realizada: number | null
          situacao: string | null
          status_planejado: string | null
          status_realizado: string | null
          unidade_medida: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atividades_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "atividades_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_consolidado: {
        Row: {
          categoria: string | null
          obra_id: string | null
          obra_nome: string | null
          org_id: string | null
          periodo: string | null
          periodo_mes: string | null
          total_aprovado: number | null
          total_despesas: number | null
          total_lancamentos: number | null
          total_pendente: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_org_usage_summary_view"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "expenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_engagement_metrics: {
        Row: {
          date: string | null
          event_name: string | null
          total_views: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          followers_count: number | null
          following_count: number | null
          id: string | null
          name: string | null
          position: string | null
          posts_count: number | null
          slug: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string | null
          name?: string | null
          position?: string | null
          posts_count?: number | null
          slug?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string | null
          name?: string | null
          position?: string | null
          posts_count?: number | null
          slug?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      public_profiles_safe: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          followers_count: number | null
          following_count: number | null
          id: string | null
          name: string | null
          position: string | null
          posts_count: number | null
          slug: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string | null
          name?: string | null
          position?: string | null
          posts_count?: number | null
          slug?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string | null
          name?: string | null
          position?: string | null
          posts_count?: number | null
          slug?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      rdo_metrics: {
        Row: {
          approved_rdos: number | null
          draft_rdos: number | null
          rdos_month: number | null
          rdos_week: number | null
          total_rdos: number | null
        }
        Relationships: []
      }
      user_metrics: {
        Row: {
          enterprise_users: number | null
          free_users: number | null
          new_users_month: number | null
          new_users_week: number | null
          pro_users: number | null
          total_users: number | null
        }
        Relationships: []
      }
      view_analytics_top_buttons: {
        Row: {
          button_id: string | null
          click_count: number | null
        }
        Relationships: []
      }
      view_analytics_top_items: {
        Row: {
          item_name: string | null
          view_count: number | null
        }
        Relationships: []
      }
      view_analytics_top_pages: {
        Row: {
          page_path: string | null
          view_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_credit_for_share: {
        Args: { p_platform: string; p_post_url: string; p_user_id: string }
        Returns: Json
      }
      check_and_grant_achievements: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      check_user_duplicates: {
        Args: { p_cpf_cnpj: string; p_email: string; p_phone: string }
        Returns: Json
      }
      create_default_user: { Args: never; Returns: undefined }
      current_org_role: {
        Args: { p_org_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      generate_org_slug: {
        Args: { org_name: string; user_id: string }
        Returns: string
      }
      get_checklist_safe: {
        Args: { p_checklist_id: string }
        Returns: {
          categoria: string
          completed_at: string
          created_at: string
          data_vencimento: string
          descricao: string
          id: string
          obra_id: string
          progresso_completo: number
          progresso_total: number
          responsavel_id: string
          signature_data: string
          signature_email: string
          signature_name: string
          signed_at: string
          started_at: string
          status: string
          template_id: string
          titulo: string
          updated_at: string
        }[]
      }
      get_org_plan_limits: {
        Args: { p_org_id: string }
        Returns: {
          max_obras: number
          max_users: number
          plan_slug: string
        }[]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_org_access: { Args: { p_org_id: string }; Returns: boolean }
      has_org_role: {
        Args: {
          p_org_id: string
          p_roles: Database["public"]["Enums"]["app_role"][]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_checklist_signer: { Args: { checklist_id: string }; Returns: boolean }
      is_org_member: { Args: { p_org_id: string }; Returns: boolean }
      process_referral: {
        Args: { new_user_id: string; referral_code_param: string }
        Returns: undefined
      }
      reset_free_plan_credits: { Args: never; Returns: undefined }
      verify_user_data_isolation: {
        Args: { p_user_id: string }
        Returns: {
          is_isolated: boolean
          other_records: number
          own_records: number
          table_name: string
        }[]
      }
    }
    Enums: {
      app_role: "Administrador" | "Gerente" | "Colaborador" | "Presidente"
      obra_status: "DRAFT" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELED"
      org_member_status: "active" | "invited" | "inactive"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["Administrador", "Gerente", "Colaborador", "Presidente"],
      obra_status: ["DRAFT", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELED"],
      org_member_status: ["active", "invited", "inactive"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "unpaid",
        "incomplete",
        "incomplete_expired",
        "paused",
      ],
    },
  },
} as const
