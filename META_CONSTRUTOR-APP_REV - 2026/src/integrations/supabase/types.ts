export type SupabaseJson =
  | string
  | number
  | boolean
  | null
  | { [key: string]: SupabaseJson | undefined }
  | SupabaseJson[]

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
          admin_id: string
          created_at: string
          details: SupabaseJson | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: SupabaseJson | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: SupabaseJson | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
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
        ]
      }
      checklist_items: {
        Row: {
          checklist_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          id: string
          is_obligatory: boolean | null
          observations: string | null
          order: number | null
          priority: string
          requires_attachment: boolean | null
          status: string
          title: string
        }
        Insert: {
          checklist_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_obligatory?: boolean | null
          observations?: string | null
          order?: number | null
          priority?: string
          requires_attachment?: boolean | null
          status?: string
          title: string
        }
        Update: {
          checklist_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_obligatory?: boolean | null
          observations?: string | null
          order?: number | null
          priority?: string
          requires_attachment?: boolean | null
          status?: string
          title?: string
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
          category: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          obra_id: string
          org_id: string
          responsible_id: string | null
          started_at: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          obra_id: string
          org_id: string
          responsible_id?: string | null
          started_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          obra_id?: string
          org_id?: string
          responsible_id?: string | null
          started_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklists_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
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
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_percentage: number
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
          discount_percentage: number
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
          discount_percentage?: number
          id?: string
          is_active?: boolean
          times_used?: number
          updated_at?: string
          usage_limit?: number | null
          valid_until?: string | null
        }
        Relationships: []
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
          status?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          created_by?: string
        }
        Relationships: []
      }
      equipes: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          funcao: string
          id: string
          nome: string
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
          telefone?: string | null
          updated_at?: string
          created_by: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          funcao?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          created_by?: string
        }
        Relationships: []
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
          rejection_reason: string | null
          supplier_name: string
          team_member_id: string | null
          updated_at: string
          user_submitting_id: string
          org_id?: string
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
          rejection_reason?: string | null
          supplier_name: string
          team_member_id?: string | null
          updated_at?: string
          user_submitting_id: string
          org_id?: string
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
          rejection_reason?: string | null
          supplier_name?: string
          team_member_id?: string | null
          updated_at?: string
          user_submitting_id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
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
          telefone?: string | null
          updated_at?: string
          created_by: string
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
          telefone?: string | null
          updated_at?: string
          created_by?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          config: SupabaseJson
          created_at: string
          id: string
          is_active: boolean
          last_sync: string | null
          service_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: SupabaseJson
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync?: string | null
          service_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: SupabaseJson
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync?: string | null
          service_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          previsao_termino: string
          prioridade: string | null
          progresso: number
          responsavel: string
          slug: string | null
          status: string
          tipo: string
          updated_at: string
          user_id: string
          org_id?: string
          orcamento_previsto?: number
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
          previsao_termino: string
          prioridade?: string | null
          progresso?: number
          responsavel: string
          slug?: string | null
          status?: string
          tipo: string
          updated_at?: string
          created_by: string
          org_id?: string
          orcamento_previsto?: number
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
          previsao_termino?: string
          prioridade?: string | null
          progresso?: number
          responsavel?: string
          slug?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          created_by?: string
          org_id?: string
          orcamento_previsto?: number
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          features: SupabaseJson | null
          id: string
          interval: string
          limits: SupabaseJson | null
          name: string
          price: number
          stripe_price_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: SupabaseJson | null
          id?: string
          interval: string
          limits?: SupabaseJson | null
          name: string
          price: number
          stripe_price_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: SupabaseJson | null
          id?: string
          interval?: string
          limits?: SupabaseJson | null
          name?: string
          price?: number
          stripe_price_id?: string | null
          type?: string
          updated_at?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
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
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
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
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
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
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
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
      rdos: {
        Row: {
          aprovado_por_id: string | null
          clima: string
          created_at: string
          criado_por_id: string
          data: string
          data_aprovacao: string | null
          equipe_ociosa: boolean
          id: string
          motivo_rejeicao: string | null
          obra_id: string
          observacoes: string | null
          periodo: string
          status: string
          tempo_ocioso: number | null
          updated_at: string
          org_id?: string
        }
        Insert: {
          aprovado_por_id?: string | null
          clima: string
          created_at?: string
          created_by: string
          data: string
          data_aprovacao?: string | null
          equipe_ociosa?: boolean
          id?: string
          motivo_rejeicao?: string | null
          obra_id: string
          observacoes?: string | null
          periodo: string
          status?: string
          tempo_ocioso?: number | null
          updated_at?: string
          org_id?: string
        }
        Update: {
          aprovado_por_id?: string | null
          clima?: string
          created_at?: string
          created_by?: string
          data?: string
          data_aprovacao?: string | null
          equipe_ociosa?: boolean
          id?: string
          motivo_rejeicao?: string | null
          obra_id?: string
          observacoes?: string | null
          periodo?: string
          status?: string
          tempo_ocioso?: number | null
          updated_at?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
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
      subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          metadata: SupabaseJson | null
          org_id: string
          plan_id: string
          quantity: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          metadata?: SupabaseJson | null
          org_id: string
          plan_id: string
          quantity?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          metadata?: SupabaseJson | null
          org_id?: string
          plan_id?: string
          quantity?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          event_data: SupabaseJson | null
          event_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: SupabaseJson | null
          event_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: SupabaseJson | null
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
      admin_users_view: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          created_at: string | null
          last_sign_in_at: string | null
          credits: number | null
          plan_name: string | null
          status: string | null
        }
      },
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
    }
    Functions: {
      add_credit_for_share: {
        Args: { p_platform: string; p_post_url: string; p_user_id: string }
        Returns: SupabaseJson
      }
      check_and_grant_achievements: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      check_user_duplicates: {
        Args: { p_cpf_cnpj: string; p_email: string; p_phone: string }
        Returns: SupabaseJson
      }
      create_default_user: { Args: never; Returns: undefined }
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
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
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
      process_referral: {
        Args: { new_user_id: string; referral_code_param: string }
        Returns: undefined
      }
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
      app_role: "Administrador" | "Gerente" | "Colaborador"
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
      app_role: ["Administrador", "Gerente", "Colaborador"],
    },
  },
} as const
